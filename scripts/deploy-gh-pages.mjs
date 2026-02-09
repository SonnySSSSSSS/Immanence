#!/usr/bin/env node
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(`Command failed: ${command} ${args.join(' ')}`);
    error.exitCode = result.status;
    throw error;
  }
}

function capture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error((result.stderr || result.stdout || '').trim() || `Command failed: ${command}`);
    error.exitCode = result.status;
    throw error;
  }
  return (result.stdout || '').trim();
}

function copyDirContents(sourceDir, destDir) {
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      cpSync(sourcePath, destPath, { recursive: true, force: true });
      continue;
    }
    if (entry.isFile()) {
      cpSync(sourcePath, destPath, { force: true });
      continue;
    }
    if (entry.isSymbolicLink()) {
      // Vite dist shouldn't contain symlinks, but handle it anyway.
      const stats = statSync(sourcePath);
      cpSync(sourcePath, destPath, { recursive: stats.isDirectory(), force: true });
    }
  }
}

function parseArgs(argv) {
  const args = new Set(argv);
  const options = {
    dryRun: args.has('--dry-run'),
    noBuild: args.has('--no-build'),
    distDir: 'dist',
    branch: 'gh-pages',
    remote: 'origin',
  };

  const distIndex = argv.indexOf('--dist');
  if (distIndex !== -1 && argv[distIndex + 1]) options.distDir = argv[distIndex + 1];

  const branchIndex = argv.indexOf('--branch');
  if (branchIndex !== -1 && argv[branchIndex + 1]) options.branch = argv[branchIndex + 1];

  const remoteIndex = argv.indexOf('--remote');
  if (remoteIndex !== -1 && argv[remoteIndex + 1]) options.remote = argv[remoteIndex + 1];

  return options;
}

const options = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const distDir = path.resolve(repoRoot, options.distDir);
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

let publishDir = '';
let exitCode = 0;

try {
  if (!existsSync(path.join(repoRoot, '.git'))) {
    throw new Error('Not a git repository (expected .git in current directory). Run from repo root.');
  }

  if (!options.noBuild) {
    run(npmCmd, ['run', 'build'], { cwd: repoRoot });
  }

  if (!existsSync(distDir)) {
    throw new Error(`Missing dist directory: ${distDir}`);
  }

  const remoteUrl = capture('git', ['config', '--get', `remote.${options.remote}.url`], { cwd: repoRoot });

  publishDir = mkdtempSync(path.join(os.tmpdir(), 'immanence-gh-pages-'));

  // Copy dist output into a fresh repo so we never have to check out (or delete) the existing gh-pages tree.
  copyDirContents(distDir, publishDir);
  writeFileSync(path.join(publishDir, '.nojekyll'), '', { encoding: 'utf8' });

  run('git', ['init'], { cwd: publishDir });
  run('git', ['checkout', '--orphan', options.branch], { cwd: publishDir });
  run('git', ['remote', 'add', options.remote, remoteUrl], { cwd: publishDir });
  run('git', ['add', '-A'], { cwd: publishDir });

  const status = capture('git', ['status', '--porcelain=v1'], { cwd: publishDir });
  const changedCount = status ? status.split('\n').filter(Boolean).length : 0;

  if (options.dryRun) {
    process.stdout.write(`[DRY RUN] Would publish ${changedCount} paths to ${options.remote}/${options.branch}.\n`);
  } else {
    if (changedCount > 0) {
      const message = `Deploy: ${new Date().toISOString()}`;
      run('git', ['commit', '-m', message], { cwd: publishDir });
    }

    run('git', ['push', '--force', options.remote, `${options.branch}:${options.branch}`], { cwd: publishDir });
    process.stdout.write('[DEPLOY] OK\n');
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n[DEPLOY] FAILED: ${message}\n`);
  exitCode = 1;
} finally {
  if (publishDir) {
    try {
      rmSync(publishDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures.
    }
  }
  process.exitCode = exitCode;
}
