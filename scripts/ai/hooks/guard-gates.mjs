#!/usr/bin/env node
/**
 * PreToolUse hook for file-editing tools: asks the user to confirm any edit to
 * the configuration of the quality gates, so an agent cannot relax a rule to
 * get a green check. Without a human (autopilot, cloud agent) "ask" is denied
 * and the agent has to stop and explain. docs/ai/workflow.md §5.
 *
 * The output carries the decision in both formats: Claude Code reads
 * `hookSpecificOutput`, GitHub Copilot the top-level fields.
 */

import { isAbsolute, relative, resolve } from 'node:path';
import { ROOT } from '../dod.mjs';
import { runHook } from './io.mjs';

const PROTECTED_PATHS = [
  /^eslint\.config\.mjs$/,
  /^stylelint\.config\.js$/,
  /^knip\.json$/,
  /^\.dependency-cruiser\.cjs$/,
  /^(e2e\/)?tsconfig(\.[\w-]+)?\.json$/,
  /^angular\.json$/,
  /^playwright\.config\.ts$/,
  /^package\.json$/,
  /^\.prettier(rc|ignore)$/,
  /^\.stylelintignore$/,
  /^\.npmrc$/,
  /^\.husky\//,
  /^\.github\/workflows\//,
  /^\.github\/hooks\//,
  /^\.claude\/settings(\.local)?\.json$/,
  /^scripts\/ai\//,
];

const PATH_FIELDS = ['file_path', 'path', 'filePath', 'notebook_path'];
const PATCH_HEADER =
  /^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm;

/** Tool arguments may arrive as an object or as a JSON string. */
function parseToolArgs(args) {
  if (typeof args !== 'string') {
    return args;
  }

  try {
    return JSON.parse(args);
  } catch {
    return { input: args };
  }
}

/** Paths an edit tool is about to touch, in the argument shapes of Claude and Copilot tools. */
function targetPaths(toolInput) {
  if (toolInput === null || typeof toolInput !== 'object') {
    return [];
  }

  const values = Object.entries(toolInput);
  const direct = values
    .filter(
      ([key, value]) => PATH_FIELDS.includes(key) && typeof value === 'string',
    )
    .map(([, value]) => value);
  // apply_patch style tools carry the paths inside the patch text
  const patched = values
    .filter(([, value]) => typeof value === 'string')
    .flatMap(([, value]) =>
      [...value.matchAll(PATCH_HEADER)].map((m) => m[1] ?? m[2]),
    );

  return [...direct, ...patched].map((path) => path.trim()).filter(Boolean);
}

function toRepoPath(path, cwd) {
  const absolute = isAbsolute(path) ? path : resolve(cwd, path);
  return relative(ROOT, absolute).replaceAll('\\', '/');
}

runHook((input) => {
  const cwd = typeof input.cwd === 'string' ? input.cwd : ROOT;
  const toolInput = parseToolArgs(input.tool_input ?? input.toolArgs);
  const protectedFiles = targetPaths(toolInput)
    .map((path) => toRepoPath(path, cwd))
    .filter((path) => PROTECTED_PATHS.some((pattern) => pattern.test(path)));

  if (protectedFiles.length === 0) {
    return {};
  }

  const reason =
    `Edición de la configuración de los quality gates (${protectedFiles.join(', ')}). ` +
    'Las reglas nunca se relajan para que el código pase (docs/architecture/quality.md §5): ' +
    'confirma solo si el cambio es intencionado y no rebaja ningún gate.';

  return {
    permissionDecision: 'ask',
    permissionDecisionReason: reason,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
    },
  };
});
