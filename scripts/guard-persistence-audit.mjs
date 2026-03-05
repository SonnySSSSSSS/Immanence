import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const auditDocPath = path.join(repoRoot, "docs", "PERSISTENCE_AUDIT.md");
const sourceRoots = ["src/state", "src/components", "src/hooks"];
const fileExts = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs"]);
const explicitKeyAllowlist = new Set([
  "ritual-storage",
  "tempo-sync-store",
  "circuit-manager",
  "circuit-journal-store",
]);

function toRel(absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, "/");
}

function walkFiles(absDir, out) {
  if (!fs.existsSync(absDir)) return;
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    if (!ent.isFile()) continue;
    if (!fileExts.has(path.extname(ent.name))) continue;
    out.push(abs);
  }
}

function unquoteToken(token) {
  if (!token || token.length < 2) return token;
  const q = token[0];
  if ((q !== "'" && q !== '"' && q !== "`") || token[token.length - 1] !== q) return token;
  return token.slice(1, -1);
}

function extractConstMap(content) {
  const out = new Map();
  const lines = content.split(/\r?\n/);
  const re = /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])([^'"`]*?)\2/;
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    out.set(m[1], m[3]);
  }
  return out;
}

function resolveTemplate(templateContent, consts) {
  const resolved = templateContent.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    const key = String(expr || "").trim();
    return consts.has(key) ? consts.get(key) : `\${${key}}`;
  });
  if (resolved.startsWith("debug:") && resolved.includes("${")) return "debug:<flag>";
  return resolved;
}

function normalizeKey(rawKey) {
  let key = String(rawKey || "").trim();
  if (!key) return "";
  key = key.replace(/\r/g, "").replace(/\n/g, " ");
  key = key.replace(/\s+/g, " ");
  if (key === "debug:") return "debug:<flag>";
  if (key.startsWith("debug:") && key.includes("${")) return "debug:<flag>";
  return key;
}

function resolveToken(token, consts) {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  const quote = trimmed[0];
  if (quote === "'" || quote === '"') return normalizeKey(unquoteToken(trimmed));
  if (quote === "`") return normalizeKey(resolveTemplate(unquoteToken(trimmed), consts));

  if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) {
    if (!consts.has(trimmed)) return null;
    return normalizeKey(consts.get(trimmed));
  }

  return null;
}

function looksLikeStorageKey(key) {
  if (!key) return false;
  if (key === "immanenceOS.*") return true;
  if (key === "debug:<flag>") return true;
  if (key.startsWith("immanence")) return true;
  if (key.startsWith("dev.navButtonTuner")) return true;
  if (key.startsWith("treatise_progress_")) return true;
  if (explicitKeyAllowlist.has(key)) return true;
  if (/^circuit-[a-z0-9-]+$/i.test(key)) return true;
  return false;
}

function collectDetectedKeys() {
  const detected = new Set();
  const files = [];
  for (const root of sourceRoots) {
    walkFiles(path.join(repoRoot, root), files);
  }

  for (const absFile of files) {
    const content = fs.readFileSync(absFile, "utf8");
    const consts = extractConstMap(content);

    // Persist key declarations.
    const nameRe = /name:\s*([A-Za-z_$][\w$]*|`[^`]*`|'[^']*'|"[^"]*")/g;
    let m;
    while ((m = nameRe.exec(content)) !== null) {
      const key = resolveToken(m[1], consts);
      if (looksLikeStorageKey(key)) detected.add(key);
    }

    // localStorage direct calls.
    const lsRe = /(?:window\.)?localStorage(?:\?\.)?\.(?:getItem|setItem|removeItem)\(\s*([A-Za-z_$][\w$]*|`[^`]*`|'[^']*'|"[^"]*")/g;
    while ((m = lsRe.exec(content)) !== null) {
      const key = resolveToken(m[1], consts);
      if (looksLikeStorageKey(key)) detected.add(key);
    }

    // Dynamic families via startsWith('immanenceOS.')
    const startsLiteralRe = /\.startsWith\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = startsLiteralRe.exec(content)) !== null) {
      const prefix = normalizeKey(m[1]);
      if (prefix === "immanenceOS.") detected.add("immanenceOS.*");
    }

    const startsIdentRe = /\.startsWith\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
    while ((m = startsIdentRe.exec(content)) !== null) {
      const ident = m[1];
      if (!consts.has(ident)) continue;
      const prefix = normalizeKey(consts.get(ident));
      if (prefix === "debug:") detected.add("debug:<flag>");
      if (prefix === "immanenceOS.") detected.add("immanenceOS.*");
    }

    // Storage key constants used indirectly by helpers.
    for (const [name, val] of consts.entries()) {
      if (!/(KEY|STORAGE|PERSIST|PREFIX)/.test(name)) continue;
      const normalized = normalizeKey(val);
      if (looksLikeStorageKey(normalized)) detected.add(normalized);
      if (normalized === "debug:") detected.add("debug:<flag>");
    }
  }

  return detected;
}

function collectDocumentedKeys() {
  if (!fs.existsSync(auditDocPath)) {
    console.error("[guard-persistence-audit] BLOCKED");
    console.error(`Missing doc: ${toRel(auditDocPath)}`);
    process.exit(1);
  }

  const doc = fs.readFileSync(auditDocPath, "utf8");
  const keys = new Set();
  const codeRe = /`([^`]+)`/g;
  let m;
  while ((m = codeRe.exec(doc)) !== null) {
    const candidate = normalizeKey(m[1]);
    if (!looksLikeStorageKey(candidate)) continue;
    keys.add(candidate);
  }
  return keys;
}

function main() {
  const detected = collectDetectedKeys();
  const documented = collectDocumentedKeys();

  const missingInDocs = [...detected].filter((k) => !documented.has(k)).sort();
  const extraInDocs = [...documented].filter((k) => !detected.has(k)).sort();

  if (missingInDocs.length > 0) {
    console.error("\n[guard-persistence-audit] BLOCKED");
    console.error("Detected persistence keys missing from docs/PERSISTENCE_AUDIT.md:");
    for (const key of missingInDocs) console.error(`- ${key}`);
    console.error("\nAdd these keys to the Key Inventory/Orphan sections before merging.");
    process.exit(1);
  }

  console.log(`[guard-persistence-audit] OK (detected=${detected.size}, documented=${documented.size})`);

  if (extraInDocs.length > 0) {
    console.warn("[guard-persistence-audit] WARN documented keys not currently detected in scan:");
    for (const key of extraInDocs) console.warn(`- ${key}`);
  }
}

main();

