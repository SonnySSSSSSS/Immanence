import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const mode = process.argv.includes("--report") ? "report" : "strict";

const protectedScopes = [
  "src/App.jsx",
  "src/components/ApplicationSection.jsx",
  "src/components/NavigationSection.jsx",
  "src/components/NavigationSelectionModal.jsx",
  "src/components/PathSelectionGrid.jsx",
  "src/components/PracticeSection.jsx",
  "src/components/HomeHub.jsx",
  "src/components/SimpleModeButton.jsx",
  "src/components/dashboard/QuickDashboardTiles.jsx",
  "src/components/practice/PracticeMenuHeader.jsx",
  "src/components/practice/SessionControls.jsx",
  "src/components/practice/SessionSummaryModal.jsx",
];

const excludedDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "logs",
  ".venv",
  "src/__quarantine__legacy",
  "src/__quarantine__graveyard",
  "src/dev",
]);

const allowedExt = new Set([".js", ".jsx", ".ts", ".tsx", ".css"]);

const forbidden = [
  /\bfontFamily\b/,
  /\bfontWeight\b/,
  /\bletterSpacing\b/,
  /font-family\s*:/,
  /font-weight\s*:/,
  /letter-spacing\s*:/,
];

function shouldIgnoreDir(absPath) {
  const rel = path.relative(repoRoot, absPath).replace(/\\/g, "/");
  if (!rel) return false;
  for (const d of excludedDirs) {
    if (rel === d || rel.startsWith(`${d}/`)) return true;
  }
  return false;
}

function walkFiles(absDir, out) {
  if (!fs.existsSync(absDir)) return;
  if (shouldIgnoreDir(absDir)) return;

  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    if (!ent.isFile()) continue;
    if (!allowedExt.has(path.extname(ent.name))) continue;
    out.push(path.relative(repoRoot, abs).replace(/\\/g, "/"));
  }
}

function isProtectedFile(relPath) {
  return protectedScopes.some((scope) => {
    const normalizedScope = scope.replace(/\\/g, "/");
    if (normalizedScope.endsWith("/")) {
      return relPath.startsWith(normalizedScope);
    }
    return relPath === normalizedScope;
  });
}

function scanFiles(fileList) {
  const violations = [];

  for (const rel of fileList) {
    const file = path.join(repoRoot, rel);
    if (!fs.existsSync(file)) {
      violations.push({ file: rel, line: 0, text: "missing file" });
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (forbidden.some((re) => re.test(line))) {
        violations.push({ file: rel, line: i + 1, text: line.trim() });
      }
    }
  }

  return violations;
}

const allFiles = [];
walkFiles(path.join(repoRoot, "src"), allFiles);

if (mode === "report") {
  const reportViolations = scanFiles(allFiles);
  if (reportViolations.length === 0) {
    console.log("[guard-typography:report] OK (no occurrences found)");
    process.exit(0);
  }

  const perFile = new Map();
  for (const v of reportViolations) {
    perFile.set(v.file, (perFile.get(v.file) || 0) + 1);
  }

  const sorted = [...perFile.entries()].sort((a, b) => b[1] - a[1]);
  console.log("[guard-typography:report] Occurrences found (non-blocking)");
  console.log(`Total matches: ${reportViolations.length}`);
  console.log("Top files:");
  for (const [file, count] of sorted.slice(0, 40)) {
    console.log(`- ${file}: ${count}`);
  }
  process.exit(0);
}

const protectedFiles = allFiles.filter(isProtectedFile);
if (protectedFiles.length === 0) {
  console.error("\n[guard-typography] BLOCKED");
  console.error("No protected files resolved from configured scopes.");
  console.error("Verify protected scopes in scripts/guard-typography.mjs.");
  process.exit(1);
}

const violations = scanFiles(protectedFiles);
if (violations.length > 0) {
  console.error("\n[guard-typography] BLOCKED");
  console.error("Inline typography props detected in protected UI files. Use canonical role classes/tokens.");
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} ${v.text}`);
  }
  process.exit(1);
}

console.log(`[guard-typography] OK (${protectedFiles.length} protected files checked)`);
for (const scope of protectedScopes) {
  const absScope = path.join(repoRoot, scope);
  if (!scope.endsWith("/") && !fs.existsSync(absScope)) {
    console.warn(`[guard-typography] WARN missing protected file: ${scope}`);
  }
}
