import type { GameAction, GameState, TrickPlay } from '../types/GameTypes';
import { trickWinner } from '@playfield/core/euchre';

/** Pause only when a trick is complete (last card played), before the trick clears. */
export const TRICK_COMPLETE_REVEAL_MS = 2800;

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

export function completedTrickFromAction(
  prev: GameState,
  action: GameAction,
  next: GameState
): { trick: TrickPlay[]; winnerId: number } | null {
  const trick = trickPlaysAfterAction(prev, action, next);
  if (!trick || !prev.trump) return null;
  const leadSuit = prev.leadSuit ?? trick[0]?.card.suit;
  if (!leadSuit) return null;
  return { trick, winnerId: trickWinner(trick, prev.trump, leadSuit) };
}

export function revealDurationMs(_trick: TrickPlay[], overrideMs?: number): number {
  return overrideMs ?? TRICK_COMPLETE_REVEAL_MS;
}

export function lastPlayedBySeatFromTrick(trick: TrickPlay[]): Record<number, TrickPlay['card']> {
  const map: Record<number, TrickPlay['card']> = {};
  for (const play of trick) {
    map[play.playerId] = play.card;
  }
  return map;
}
