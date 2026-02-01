// scripts/guard-dev.mjs
// Hard guard to prevent starting dev server in a "rewritten"/polluted repo state.
//
// BLOCK conditions (default):
// 1) Must be inside a Git repo + current folder must be a registered worktree.
// 2) Must NOT contain "repo rewrite/pollution" markers (directories/files).
// 3) Must have at least one git remote; optionally require specific remote names.
// 4) Hard-block if forbidden markers appear in changed/staged files.
// 5) Warn on dirty tree (unless forbidden markers are involved).
//
// Optional config: scripts/guard.config.json
// {
//   "requireRemoteNames": ["origin2"],
//   "forbidPathPrefixes": ["_backup_assets/", "public/generated/", "public/videos/"],
//   "forbidPathRegex": ["^node-v\\d+.*\\.msi$", "^immanence-os-main-merge/"],
//   "maxChangedEntries": 200
// }

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function fail(msg) {
  console.error(`\n[guard-dev] BLOCKED\n${msg}\n`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`\n[guard-dev] WARN\n${msg}\n`);
}

function loadConfig(repoRoot) {
  const p = path.join(repoRoot, "scripts", "guard.config.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`Invalid JSON in scripts/guard.config.json.\n${String(e)}`);
  }
}

function getRepoRoot() {
  try {
    return sh("git rev-parse --show-toplevel");
  } catch {
    fail("Not a git repository. Run dev only inside the real repo root/worktree.");
  }
}

function getWorktreesPorcelain() {
  try {
    return sh("git worktree list --porcelain");
  } catch {
    return "";
  }
}

function currentWorktreeMustExist(repoRoot) {
  const wt = getWorktreesPorcelain();
  const cwd = process.cwd().replace(/\\/g, "/");

  if (!wt) {
    // If porcelain unavailable, at least ensure repoRoot has a .git entry.
    const gitPath = path.join(repoRoot, ".git");
    if (!fs.existsSync(gitPath)) {
      fail(
        "Missing .git at repo root. This looks like a reconstructed folder, not a real worktree."
      );
    }
    return;
  }

  const lines = wt.split(/\r?\n/);
  const paths = [];
  for (const line of lines) {
    if (line.startsWith("worktree ")) paths.push(line.slice("worktree ".length));
  }
  const normalized = paths.map((p) => p.replace(/\\/g, "/"));
  // Case-insensitive comparison for Windows paths
  const cwdLower = cwd.toLowerCase();
  const isInWorktree = normalized.some((p) => {
    const pLower = p.toLowerCase();
    return cwdLower === pLower || cwdLower.startsWith(pLower + "/");
  });
  if (!isInWorktree) {
    fail(
      `Current directory is not a registered git worktree.\n` +
        `cwd: ${cwd}\n` +
        `worktrees:\n- ${normalized.join("\n- ")}\n\n` +
        `This commonly happens after a folder got rebuilt/copied.`
    );
  }
}

function getRemotes() {
  try {
    // one remote name per line
    const out = sh("git remote");
    if (!out) return [];
    return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function compileForbidMatchers(cfg) {
  const forbidPrefixes = (cfg?.forbidPathPrefixes ?? [
    "_backup_assets/",
    "public/generated/",
    "public/videos/",
  ]).map((s) => s.replace(/\\/g, "/"));

  const forbidRegex = (cfg?.forbidPathRegex ?? [
    "^node-v\\d+.*\\.msi$",
    "^node-v\\d+.*\\.exe$",
    "^immanence-os-main-merge/",
  ]).map((r) => new RegExp(r));

  return { forbidPrefixes, forbidRegex };
}

function isForbiddenPath(rel, forbidPrefixes, forbidRegex) {
  const p = rel.replace(/\\/g, "/");
  if (forbidPrefixes.some((pre) => p.startsWith(pre))) return true;
  if (forbidRegex.some((re) => re.test(p))) return true;
  return false;
}

function scanForExistingPollution(repoRoot, forbidPrefixes, forbidRegex) {
  // Fast existence checks for prefix directories at repo root
  for (const pre of forbidPrefixes) {
    // Only check directory prefixes that are top-level-ish
    const top = pre.split("/")[0];
    const candidate = path.join(repoRoot, top);
    if (fs.existsSync(candidate)) {
      // If it’s a file or directory, and it matches forbidden logic, block
      // (We only know "top", so confirm by checking relative path itself exists if possible.)
      if (top && (top + "/") === pre || pre === (top + "/")) {
        fail(`Forbidden repo marker exists: ${top}\nThis looks like a polluted/rewrite snapshot.`);
      }
      // If prefix is deeper (e.g. public/generated/), check that exact path:
      const exact = path.join(repoRoot, pre.replace(/\//g, path.sep));
      if (fs.existsSync(exact)) {
        fail(`Forbidden repo marker exists: ${pre}\nThis looks like a polluted/rewrite snapshot.`);
      }
    }
  }

  // Also check common “rebuilt folder” smell: .git is a directory but worktree metadata missing.
  // (Not perfect, but catches naive copy/paste + git init cases.)
  const gitEntry = path.join(repoRoot, ".git");
  if (fs.existsSync(gitEntry)) {
    const st = fs.statSync(gitEntry);
    if (st.isDirectory()) {
      // If it’s a normal repo root, that’s fine, but we require remote sanity below.
      // No action here.
    }
  }

  // Optional: quick file pattern check at repo root (msi/exe node installers)
  const rootEntries = fs.readdirSync(repoRoot, { withFileTypes: true });
  for (const ent of rootEntries) {
    if (!ent.isFile()) continue;
    const rel = ent.name;
    if (isForbiddenPath(rel, [], forbidRegex)) {
      fail(`Forbidden file at repo root: ${rel}\nThis looks like a polluted/rewrite snapshot.`);
    }
  }
}

function parseGitStatusPorcelainZ() {
  // Format: XY <path>\0 (with rename forms: XY <orig>\0<new>\0)
  // We only need paths; treat renames by capturing both.
  let out = "";
  try {
    out = execSync("git status --porcelain=v1 -z", {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
  } catch {
    return [];
  }
  if (!out) return [];
  const parts = out.split("\0").filter(Boolean);

  const entries = [];
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i];
    const xy = item.slice(0, 2);
    let rest = item.slice(3); // after "XY "
    // Rename/copy: "R  old -> new" may appear in non -z, but in -z it’s "R  old\0new\0"
    // In v1 -z: first record contains old path, next record is new path for R/C.
    if ((xy[0] === "R" || xy[0] === "C") && (i + 1) < parts.length) {
      const oldPath = rest;
      const newPath = parts[i + 1];
      entries.push({ xy, path: oldPath, staged: xy[0] !== " " });
      entries.push({ xy, path: newPath, staged: xy[0] !== " " });
      i += 1;
      continue;
    }
    entries.push({ xy, path: rest, staged: xy[0] !== " " });
  }
  return entries;
}

function main() {
  const repoRoot = getRepoRoot();
  const cfg = loadConfig(repoRoot);

  // Must be in registered worktree (blocks “running dev inside a copied folder”).
  currentWorktreeMustExist(repoRoot);

  const remotes = getRemotes();
  if (remotes.length === 0) {
    fail(
      "No git remotes found.\nThis is a strong indicator of a rebuilt/copied repo folder (git init in the wrong place)."
    );
  }

  const requireRemoteNames = cfg?.requireRemoteNames ?? [];
  for (const r of requireRemoteNames) {
    if (!remotes.includes(r)) {
      fail(
        `Missing required remote '${r}'.\nFound remotes: ${remotes.join(", ") || "(none)"}\n` +
          `This often happens when you are in a rewritten/copied repo instead of the real one.`
      );
    }
  }

  const { forbidPrefixes, forbidRegex } = compileForbidMatchers(cfg);

  // BLOCK if pollution markers already exist in the tree.
  scanForExistingPollution(repoRoot, forbidPrefixes, forbidRegex);

  // Check git status and block if forbidden markers appear in changes (especially staged).
  const status = parseGitStatusPorcelainZ();
  const maxChangedEntries = cfg?.maxChangedEntries ?? 200;

  if (status.length > 0) {
    const forbidden = status.filter((e) => isForbiddenPath(e.path, forbidPrefixes, forbidRegex));
    const forbiddenStaged = forbidden.filter((e) => e.staged);

    if (forbiddenStaged.length > 0) {
      fail(
        `Forbidden markers are STAGED in git status:\n- ${forbiddenStaged
          .slice(0, 30)
          .map((e) => e.path)
          .join("\n- ")}\n\nUnstage/remove these before running dev.`
      );
    }

    if (forbidden.length > 0) {
      fail(
        `Forbidden markers are present in working tree changes:\n- ${forbidden
          .slice(0, 30)
          .map((e) => e.path)
          .join("\n- ")}\n\nThis strongly suggests a polluted/rewrite snapshot.`
      );
    }

    if (status.length > maxChangedEntries) {
      warn(
        `Working tree has ${status.length} changed entries (limit ${maxChangedEntries}).\n` +
          `This is often a symptom of running in the wrong folder or a bad merge.\n` +
          `Dev will continue, but verify: git status`
      );
    } else {
      warn(
        `Working tree is not clean (${status.length} changed/untracked entries).\n` +
          `Dev will continue, but if something looks wrong: git status first.`
      );
    }
  }

  // If we reached here, we’re good.
  console.log("[guard-dev] OK");
}

main();
