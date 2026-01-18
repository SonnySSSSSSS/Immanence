#!/usr/bin/env node
/*
 Agent Lane Enforcement: Restrict agent model capability based on work type.
 
 SIMPLE lane: read-only, docs, boilerplate (Haiku allowed)
 ENGINEERING lane: code changes, bugfixes, behavior changes (no restrictions)
 
 Enforces by file changes, not by model declaration.
*/
const fs = require('fs');
const { execSync } = require('child_process');

const laneFile = 'AGENT_LANE.txt';
const SIMPLE_RESTRICTED = [
  'src/**',
  'public/**',
  '**/*.css',
  'package.json',
  'vite.config.js',
  'eslint.config.js',
];

// Read lane
let lane;
try {
  lane = fs.readFileSync(laneFile, 'utf8').trim().toUpperCase();
} catch (e) {
  console.error(`❌ AGENT_LANE.txt missing or unreadable`);
  process.exit(1);
}

if (!['SIMPLE', 'ENGINEERING'].includes(lane)) {
  console.error(`❌ AGENT_LANE.txt invalid. Must be SIMPLE or ENGINEERING, got: ${lane}`);
  process.exit(1);
}

// Get changed files
let changedFiles = [];
try {
  // Check if we're in a PR (GitHub Actions sets GITHUB_BASE_REF)
  const isCI = process.env.CI === 'true';
  const baseRef = process.env.GITHUB_BASE_REF;

  if (isCI && baseRef) {
    // PR: diff against base branch
    changedFiles = execSync(
      `git diff --name-only origin/${baseRef}...HEAD`,
      { encoding: 'utf8' }
    )
      .split('\n')
      .filter(f => f.length > 0);
  } else {
    // Push: use git show to get files changed in HEAD commit only
    try {
      changedFiles = execSync(
        `git show --name-only --format="" HEAD`,
        { encoding: 'utf8' }
      )
        .split('\n')
        .filter(f => f.length > 0);
    } catch {
      // Fallback: initial commit or error - use diff against empty tree
      changedFiles = execSync(
        `git diff --name-only --cached`,
        { encoding: 'utf8' }
      )
        .split('\n')
        .filter(f => f.length > 0);
    }
  }
} catch (e) {
  console.error(`❌ Failed to get changed files: ${e.message}`);
  process.exit(1);
}

if (changedFiles.length === 0) {
  console.log(`✓ Lane: ${lane} | No files changed`);
  process.exit(0);
}

// Check restrictions
if (lane === 'SIMPLE') {
  const violations = changedFiles.filter(file => {
    const normalized = file.replace(/\\/g, '/');
    return (
      normalized.startsWith('src/') ||
      normalized.startsWith('public/') ||
      normalized.endsWith('.css') ||
      normalized === 'package.json' ||
      normalized === 'vite.config.js' ||
      normalized === 'eslint.config.js'
    );
  });

  if (violations.length > 0) {
    console.error(`❌ Lane: ${lane} | BLOCKED - Changed files in restricted areas:`);
    violations.forEach(f => console.error(`   ${f}`));
    console.error(``);
    console.error(`SIMPLE lane allows:`);
    console.error(`  - Read-only analysis (no code changes)`);
    console.error(`  - Markdown/docs edits`);
    console.error(`  - Non-runtime boilerplate`);
    console.error(`  - Mechanical edits (rename, format)`);
    console.error(``);
    console.error(`To make code/behavior changes, use: Lane: ENGINEERING`);
    process.exit(1);
  }

  console.log(`✓ Lane: ${lane} | ${changedFiles.length} file(s) OK`);
  process.exit(0);
}

// ENGINEERING lane: no restrictions
console.log(`✓ Lane: ${lane} | ${changedFiles.length} file(s) | No restrictions`);
process.exit(0);
