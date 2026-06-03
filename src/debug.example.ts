/**
 * Copy this file to `src/debug.ts` (gitignored) and tweak values for local dev.
 *
 *   copy src\debug.example.ts src\debug.ts
 */
import type { DebugConfig } from './debug.types';

export const DEBUG: DebugConfig = {
  enabled: true,
  aiTurnDelayMs: null,
  logActions: false,
  autoStart: null,
  // autoStart: { enabled: true, humanSeats: [0] },
};
