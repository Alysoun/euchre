import { DEFAULT_EUCHRE_AI_DIFFICULTY, normalizeEuchreAIDifficulty } from './aiDifficulty';
import type { GameLogEntry, GameState } from './types';

export const UI_LOG_CAP = 40;

let logCounter = 0;

export function resetLogCounter(): void {
  logCounter = 0;
}

function maxNumericLogId(entries: Iterable<GameLogEntry>): number {
  let max = 0;
  for (const entry of entries) {
    const match = /^log-(\d+)$/.exec(entry.id);
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return max;
}

export function adoptLogCounterFromState(state: GameState): void {
  logCounter = Math.max(logCounter, maxNumericLogId(state.log));
}

export function ensureUniqueLogIds(state: GameState): GameState {
  const seen = new Set<string>();
  let nextNum = logCounter;

  const reid = (entries: GameLogEntry[]): GameLogEntry[] =>
    entries.map((entry) => {
      const numeric = /^log-(\d+)$/.exec(entry.id);
      if (numeric) nextNum = Math.max(nextNum, Number.parseInt(numeric[1], 10));

      if (!seen.has(entry.id)) {
        seen.add(entry.id);
        return entry;
      }

      nextNum += 1;
      const id = `log-${nextNum}`;
      seen.add(id);
      return { ...entry, id };
    });

  logCounter = nextNum;
  const log = reid(state.log);
  if (log === state.log) return state;
  return { ...state, log };
}

export function createLogEntry(
  message: string,
  type: GameLogEntry['type'] = 'info'
): GameLogEntry {
  logCounter += 1;
  return { id: `log-${logCounter}`, message, type };
}

export function pushLog(state: GameState, entry: GameLogEntry): GameState {
  return { ...state, log: [...state.log.slice(-(UI_LOG_CAP - 1)), entry] };
}

export function pushLogMessage(
  state: GameState,
  message: string,
  type: GameLogEntry['type'] = 'info'
): GameState {
  return pushLog(state, createLogEntry(message, type));
}

/** Call after loading persisted state so log IDs stay unique across HMR/reloads. */
export function repairLoadedGameSession(state: GameState): GameState {
  adoptLogCounterFromState(state);
  return ensureUniqueLogIds({
    ...state,
    aiDifficulty: normalizeEuchreAIDifficulty(
      (state as GameState).aiDifficulty ?? DEFAULT_EUCHRE_AI_DIFFICULTY
    ),
  });
}
