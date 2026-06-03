import { describe, expect, it } from 'vitest';
import { createCard } from '@playfield/core/euchre';
import type { GameState } from '../../types/GameTypes';
import { revealDurationMs, trickPlaysAfterAction } from '../trickReveal';

describe('trickReveal', () => {
  it('pauses only when the fourth card completes a trick', () => {
    const card = createCard('spades', 'A');
    const prev = {
      phase: 'playing',
      currentPlayer: 3,
      goAlone: false,
      currentTrick: [
        { playerId: 0, card: createCard('spades', '9') },
        { playerId: 1, card: createCard('spades', '10') },
        { playerId: 2, card: createCard('spades', 'K') },
      ],
    } as GameState;
    const next = { ...prev, currentTrick: [] } as GameState;
    const shown = trickPlaysAfterAction(prev, { type: 'PLAY_CARD', card }, next);
    expect(shown).toHaveLength(4);
    expect(shown![3].card.id).toBe(card.id);
    expect(revealDurationMs(shown!)).toBe(2400);
  });

  it('pauses when the third card completes a lone trick', () => {
    const card = createCard('hearts', '10');
    const prev = {
      phase: 'playing',
      currentPlayer: 2,
      goAlone: true,
      lonerId: 0,
      currentTrick: [
        { playerId: 0, card: createCard('clubs', '9') },
        { playerId: 2, card: createCard('clubs', 'K') },
      ],
    } as GameState;
    const shown = trickPlaysAfterAction(prev, { type: 'PLAY_CARD', card }, {
      ...prev,
      currentTrick: [],
    } as GameState);
    expect(shown).toHaveLength(3);
  });

  it('does not pause after cards 1–3 of a four-card trick', () => {
    const card = createCard('hearts', '10');
    const prev = {
      phase: 'playing',
      currentPlayer: 1,
      goAlone: false,
      currentTrick: [{ playerId: 0, card: createCard('clubs', '9') }],
    } as GameState;
    const next = {
      ...prev,
      currentTrick: [...prev.currentTrick, { playerId: 1, card }],
    } as GameState;
    expect(trickPlaysAfterAction(prev, { type: 'PLAY_CARD', card }, next)).toBeNull();
  });
});
