import type { GameState, Player } from '../types/GameTypes';
import { displayPlayerName } from './playerName';

export function trumpCallerPlayer(
  state: Pick<GameState, 'trumpCallerId' | 'players'>
): Player | null {
  if (state.trumpCallerId === null) return null;
  return state.players[state.trumpCallerId] ?? null;
}

/** Short line for trump pill / seat labels. */
export function trumpCallerShortLabel(
  state: Pick<GameState, 'trumpCallerId' | 'trumpCallKind' | 'goAlone' | 'players'>
): string | null {
  const player = trumpCallerPlayer(state);
  if (!player) return null;
  const name = displayPlayerName(player);
  if (state.goAlone) {
    return `${name} · alone`;
  }
  if (state.trumpCallKind === 'orderUp') {
    return `${name} ordered up`;
  }
  if (state.trumpCallKind === 'nameTrump') {
    return `${name} named trump`;
  }
  return `${name} called it`;
}

/** Seat label suffix when this player made trump. */
export function trumpCallerSeatHint(
  state: Pick<GameState, 'trumpCallKind' | 'goAlone'>
): string {
  if (state.goAlone) return 'Going alone';
  if (state.trumpCallKind === 'orderUp') return 'Ordered up';
  if (state.trumpCallKind === 'nameTrump') return 'Named trump';
  return 'Made trump';
}
