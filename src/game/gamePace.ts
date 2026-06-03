export type GamePace = 'normal' | 'instant';

export const DEFAULT_GAME_PACE: GamePace = 'normal';

const STORAGE_KEY = 'euchre-game-pace';

export type PaceTimings = {
  aiTurnMs: number;
  trickRevealMs: number;
  trickCollectMs: number;
  cardPlayBeatMs: number;
  bidBeatMs: number;
  turnedCardRevealMs: number;
  dealCardStaggerMs: number;
  dealCardTravelMs: number;
};

export function normalizeGamePace(raw: string | null | undefined): GamePace {
  return raw === 'instant' ? 'instant' : 'normal';
}

export function loadStoredGamePace(): GamePace {
  try {
    return normalizeGamePace(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_GAME_PACE;
  }
}

export function saveStoredGamePace(pace: GamePace): void {
  try {
    localStorage.setItem(STORAGE_KEY, pace);
  } catch {
    /* ignore */
  }
}

export function paceTimings(pace: GamePace): PaceTimings {
  if (pace === 'instant') {
    return {
      aiTurnMs: 0,
      trickRevealMs: 350,
      trickCollectMs: 0,
      cardPlayBeatMs: 0,
      bidBeatMs: 0,
      turnedCardRevealMs: 0,
      dealCardStaggerMs: 0,
      dealCardTravelMs: 0,
    };
  }
  return {
    aiTurnMs: 950,
    trickRevealMs: 2800,
    trickCollectMs: 950,
    cardPlayBeatMs: 480,
    bidBeatMs: 750,
    turnedCardRevealMs: 1900,
    dealCardStaggerMs: 68,
    dealCardTravelMs: 520,
  };
}

export function aiTurnDelayMs(pace: GamePace): number {
  return paceTimings(pace).aiTurnMs;
}

export function dealAnimationDurationMs(pace: GamePace): number {
  const t = paceTimings(pace);
  const cardsDealt = 20;
  return t.dealCardTravelMs + t.dealCardStaggerMs * (cardsDealt - 1) + 120;
}

export function handKey(state: {
  roundNumber: number;
  dealerId: number;
  phase: string;
}): string {
  return `${state.roundNumber}-${state.dealerId}-${state.phase === 'bidding' ? 'deal' : state.phase}`;
}

export function biddingHandKey(state: { roundNumber: number; dealerId: number }): string {
  return `${state.roundNumber}-${state.dealerId}-bidding`;
}
