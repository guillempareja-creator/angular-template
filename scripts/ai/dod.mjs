#!/usr/bin/env node
/**
 * Definition of Done stamp, shared by `npm run check` and the AI agent hooks
 * (docs/ai/workflow.md).
 *
 * The state of the working tree is fingerprinted as a git tree hash (tracked
 * and untracked files, `.gitignore` respected), so committing does not change
 * it but editing any file does. When `npm run check` / `check:static` finish
 * green they stamp that fingerprint; the Stop hook compares it with the
 * current one to know whether the agent's changes were verified.
 *
 * CLI:
 *   node scripts/ai/dod.mjs stamp <static|full>   (called by package.json)
 *   node scripts/ai/dod.mjs status                (human-readable check)
 */

import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

const STATE_FILE = join(ROOT, 'node_modules', '.cache', 'ai-dod', 'state.json');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LEVELS = ['static', 'full'];

//----------------------------------------------------------------
// GIT
//----------------------------------------------------------------

function git(args, env = process.env) {
  return execFileSync('git', args, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

/** Tree hash of the whole working tree (tracked + untracked, not ignored). */
export function fingerprint() {
  const tmpIndex = join(tmpdir(), `ai-dod-index-${process.pid}-${Date.now()}`);
  const realIndex = resolve(ROOT, git(['rev-parse', '--git-path', 'index']));
  const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };

  try {
    // Reusing the real index keeps its stat cache: only changed files are hashed
    if (existsSync(realIndex)) {
      copyFileSync(realIndex, tmpIndex);
    }
    git(['add', '--all'], env);
    return git(['write-tree'], env);
  } finally {
    rmSync(tmpIndex, { force: true });
  }
}

/** Tree of the last commit, or `null` in a repository without commits. */
export function headTree() {
  try {
    return git(['rev-parse', 'HEAD^{tree}']);
  } catch {
    return null;
  }
}

/** Paths that differ between two tree hashes. */
export function changedPaths(fromTree, toTree) {
  const args = fromTree
    ? ['diff', '--name-only', fromTree, toTree]
    : ['ls-tree', '-r', '--name-only', toTree];

  return git(args).split('\n').filter(Boolean);
}

/** Markdown-only changes only need the static checks (docs/architecture/quality.md). */
export function requiredLevel(paths) {
  return paths.every((path) => path.endsWith('.md')) ? 'static' : 'full';
}

//----------------------------------------------------------------
// STATE (node_modules/.cache/ai-dod/state.json)
//----------------------------------------------------------------

export function readState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { stamps: {}, sessions: {} };
  }
}

export function writeState(state) {
  const now = Date.now();
  const sessions = Object.fromEntries(
    Object.entries(state.sessions ?? {}).filter(
      ([, session]) => now - session.at < SESSION_TTL_MS,
    ),
  );

  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ ...state, sessions }, null, 2));
}

/**
 * Whether `tree` passed the checks that `level` requires. Touching only
 * markdown after a green `check` needs just a green `check:static` on top.
 */
export function isVerified(state, tree, level) {
  const { full, static: staticStamp } = state.stamps ?? {};
  if (full?.tree === tree) {
    return true;
  }
  if (staticStamp?.tree !== tree) {
    return false;
  }
  if (level === 'static') {
    return true;
  }

  try {
    return (
      Boolean(full?.tree) &&
      requiredLevel(changedPaths(full.tree, tree)) === 'static'
    );
  } catch {
    return false;
  }
}

//----------------------------------------------------------------
// CLI
//----------------------------------------------------------------

function stamp(level) {
  if (!LEVELS.includes(level)) {
    console.error(
      `Unknown level "${level}". Use one of: ${LEVELS.join(', ')}.`,
    );
    process.exit(1);
  }

  try {
    const state = readState();
    writeState({
      ...state,
      stamps: {
        ...state.stamps,
        [level]: { tree: fingerprint(), at: Date.now() },
      },
    });
    console.log(
      `\n✔ Definition of Done (${level}) verified for the current changes.`,
    );
  } catch (error) {
    // The stamp only feeds the agent hooks: it must never fail a green check
    console.warn(`DoD stamp not written: ${String(error)}`);
  }
}

function status() {
  const tree = fingerprint();
  const head = headTree();
  if (tree === head) {
    console.log('No changes against HEAD: nothing to verify.');
    return;
  }

  const level = requiredLevel(changedPaths(head, tree));
  console.log(
    isVerified(readState(), tree, level)
      ? `Verified: the current changes passed the ${level} checks.`
      : `Not verified: run \`npm run ${level === 'full' ? 'check' : 'check:static'}\`.`,
  );
}

const isCli =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const [command, arg] = process.argv.slice(2);
  if (command === 'stamp') {
    stamp(arg);
  } else if (command === 'status') {
    status();
  } else {
    console.error(
      'Usage: node scripts/ai/dod.mjs <stamp static|full | status>',
    );
    process.exit(1);
  }
}
