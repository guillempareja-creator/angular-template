#!/usr/bin/env node
/**
 * SessionStart hook: remembers the state of the files when the agent session
 * starts, so the Stop hook only asks to verify the changes made during the
 * session (not the user's previous work). docs/ai/workflow.md §5.
 */

import { fingerprint, readState, writeState } from '../dod.mjs';
import { runHook, sessionIdOf } from './io.mjs';

runHook((input) => {
  const id = sessionIdOf(input);
  const state = readState();

  // Resumed or compacted sessions keep their original baseline
  if (!state.sessions?.[id]) {
    writeState({
      ...state,
      sessions: {
        ...state.sessions,
        [id]: { tree: fingerprint(), at: Date.now() },
      },
    });
  }

  return {};
});
