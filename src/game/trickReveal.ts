import type { GameAction, GameState, TrickPlay } from '../types/GameTypes';

/** Pause only when a trick is complete (last card played), before the trick clears. */
export const TRICK_COMPLETE_REVEAL_MS = 2400;

export function trickPlaysAfterAction(
  prev: GameState,
  action: GameAction,
  _next: GameState
): TrickPlay[] | null {
  if (prev.phase !== 'playing' || action.type !== 'PLAY_CARD') return null;

  const trickSize = prev.goAlone ? 3 : 4;
  if (prev.currentTrick.length !== trickSize - 1) return null;

  return [...prev.currentTrick, { playerId: prev.currentPlayer, card: action.card }];
}

export function revealDurationMs(_trick: TrickPlay[]): number {
  return TRICK_COMPLETE_REVEAL_MS;
}

export function lastPlayedBySeatFromTrick(trick: TrickPlay[]): Record<number, TrickPlay['card']> {
  const map: Record<number, TrickPlay['card']> = {};
  for (const play of trick) {
    map[play.playerId] = play.card;
  }
  return map;
}
