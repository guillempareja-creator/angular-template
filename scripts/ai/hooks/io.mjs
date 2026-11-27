/**
 * Input/output helpers shared by the agent hooks. Claude Code and GitHub
 * Copilot both send the event as JSON on stdin and read one JSON object from
 * stdout (docs/ai/workflow.md §5).
 */

import { setTimeout as sleep } from 'node:timers/promises';

// Some hosts keep stdin open: never wait for it longer than this
const STDIN_TIMEOUT_MS = 3000;

export async function readHookInput() {
  if (process.stdin.isTTY) {
    return {};
  }

  let data = '';
  process.stdin.setEncoding('utf8');
  const reading = (async () => {
    for await (const chunk of process.stdin) {
      data += chunk;
    }
  })();
  await Promise.race([reading, sleep(STDIN_TIMEOUT_MS)]);

  try {
    const parsed = JSON.parse(data);
    return parsed !== null && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Session id in both payload formats (Claude / VS Code `session_id`, Copilot `sessionId`). */
export function sessionIdOf(input) {
  const id = input.session_id ?? input.sessionId;
  return typeof id === 'string' && id !== '' ? id : 'default';
}

/** Writes the hook output and exits (also when the host keeps stdin open). */
export function finish(output = {}) {
  process.stdout.write(JSON.stringify(output), () => {
    process.exit(0);
  });
}

/** Runs a hook and fails open: a broken hook must never block the agent. */
export function runHook(handler) {
  readHookInput()
    .then(handler)
    .then(finish, (error) => {
      console.error(`[ai hook] skipped: ${String(error)}`);
      finish({});
    });
}
