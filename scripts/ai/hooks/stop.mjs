#!/usr/bin/env node
/**
 * Stop hook (Claude Code `Stop`, GitHub Copilot `agentStop`): when the agent
 * changed files during the session and the current state has no green
 * `npm run check` stamp, it blocks the end of the turn once and asks the agent
 * to verify. If the agent stops again (e.g. it is waiting for the user), it is
 * let go and the user sees a warning. docs/ai/workflow.md §5.
 */

import {
  changedPaths,
  fingerprint,
  headTree,
  isVerified,
  readState,
  requiredLevel,
} from '../dod.mjs';
import { runHook, sessionIdOf } from './io.mjs';

const COMMANDS = { full: 'npm run check', static: 'npm run check:static' };
const MAX_LISTED_FILES = 10;

function listFiles(paths) {
  const listed = paths.slice(0, MAX_LISTED_FILES).map((path) => `  - ${path}`);
  const rest = paths.length - listed.length;
  return rest > 0 ? [...listed, `  - … y ${rest} más`] : listed;
}

runHook((input) => {
  const state = readState();
  const tree = fingerprint();
  const baseline = state.sessions?.[sessionIdOf(input)]?.tree ?? headTree();

  if (tree === baseline) {
    return {};
  }

  const changed = changedPaths(baseline, tree);
  const level = requiredLevel(changed);
  if (isVerified(state, tree, level)) {
    return {};
  }

  const command = COMMANDS[level];
  if (input.stop_hook_active === true) {
    return {
      systemMessage: `⚠️ Cambios sin verificar: no hay un \`${command}\` en verde para el estado actual (${changed.length} fichero(s) cambiados en esta sesión).`,
    };
  }

  return {
    decision: 'block',
    reason: [
      `Definition of Done pendiente: en esta sesión han cambiado ${changed.length} fichero(s) y no hay un \`${command}\` en verde para su estado actual:`,
      ...listFiles(changed),
      '',
      `- Si la tarea está terminada: usa la skill \`verify\` (ejecuta \`${command}\`, corrige y repite hasta verde) y después termina.`,
      '- Si NO has terminado (esperas una respuesta del usuario o queda trabajo): díselo explícitamente al usuario y termina el turno; no se volverá a bloquear.',
      '- Nunca relajes un gate para conseguir el verde (AGENTS.md).',
    ].join('\n'),
  };
});
