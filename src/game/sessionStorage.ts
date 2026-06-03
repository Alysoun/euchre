import type { GameState } from '../types/GameTypes';
import {
  initialGameState,
  repairLoadedGameSession,
} from '@playfield/core/euchre';

/** Persists in-progress games across browser restarts (localStorage). */
const STORAGE_KEY = 'euchre-active-session';
/** Previous tab-only storage — migrated once on load. */
const LEGACY_SESSION_KEY = STORAGE_KEY;

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

const RESUMABLE_PHASES = new Set<GameState['phase']>([
  'bidding',
  'biddingRound2',
  'stickTheDealer',
  'dealerDiscard',
  'playing',
  'handSummary',
]);

function isPersistedGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameState;
  if (!Array.isArray(s.players) || s.players.length !== 4) return false;
  if (!RESUMABLE_PHASES.has(s.phase)) return false;
  return s.players.every(
    (p) =>
      p &&
      typeof p === 'object' &&
      typeof p.team === 'number' &&
      (p.team === 0 || p.team === 1) &&
      Array.isArray(p.cards)
  );
}

function readRaw(key: string): string | null {
  const store = storage();
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function parseStored(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedGameState(parsed)) return null;
    return { ...initialGameState, ...parsed };
  } catch {
    return null;
  }
}

function migrateLegacySession(): GameState | null {
  try {
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!legacy) return null;
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    const loaded = parseStored(legacy);
    if (loaded) saveGameSession(loaded);
    return loaded;
  } catch {
    return null;
  }
}

export function loadGameSession(): GameState | null {
  const fromLocal = parseStored(readRaw(STORAGE_KEY));
  const loaded = fromLocal ?? migrateLegacySession();
  if (!loaded) return null;
  return repairLoadedGameSession(loaded);
}

export function saveGameSession(state: GameState): void {
  if (
    state.players.length === 0 ||
    state.phase === 'setup' ||
    state.phase === 'gameOver'
  ) {
    clearGameSession();
    return;
  }
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function clearGameSession(): void {
  const store = storage();
  try {
    store?.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
