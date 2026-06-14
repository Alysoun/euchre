import { describe, expect, it } from 'vitest';
import { createCard } from '../cards';
import { pickExpertPlay } from '../aiStrategy';
import { gatherPlayedCards, isBossTrump } from '../aiPlayMemory';
import type { GameState } from '../types';

describe('aiPlayMemory', () => {
  it('tracks completed tricks and the current trick', () => {
    const state = {
      cardsPlayed: [createCard('clubs', 'A')],
      currentTrick: [{ playerId: 1, card: createCard('hearts', '10') }],
    } as GameState;
    const played = gatherPlayedCards(state);
    expect(played.map((c) => c.id).sort()).toEqual(
      ['clubs-A', 'hearts-10'].sort()
    );
  });

  it('knows when a trump card is boss from seen cards', () => {
    const trump = 'spades' as const;
    const played = [
      createCard('spades', 'J'),
      createCard('clubs', 'J'),
      createCard('spades', 'A'),
    ];
    expect(isBossTrump(createCard('spades', 'K'), trump, played, [])).toBe(true);
    expect(isBossTrump(createCard('spades', '10'), trump, played, [])).toBe(false);
  });
});

describe('aiStrategy follow with play memory', () => {
  it('third seat sloughs low trump when higher trump is still unaccounted', () => {
    const trump = 'spades' as const;
    const trick = [
      { playerId: 2, card: createCard('clubs', '10') },
      { playerId: 3, card: createCard('clubs', 'A') },
    ];
    const state = {
      phase: 'playing',
      trump,
      leadSuit: 'clubs' as const,
      currentTrick: trick,
      cardsPlayed: [],
      makerTeam: 1,
      goAlone: false,
      lonerId: null,
      dealerId: 1,
      tricksWon: { 0: 0, 1: 0 },
      players: [
        {
          id: 0,
          name: 'P',
          isHuman: false,
          team: 0,
          cards: [createCard('spades', '10'), createCard('hearts', '9')],
        },
        { id: 1, name: 'D', isHuman: false, team: 1, cards: [] },
        { id: 2, name: 'L', isHuman: false, team: 0, cards: [] },
        { id: 3, name: 'O', isHuman: false, team: 1, cards: [] },
      ],
      currentPlayer: 0,
    } as GameState;

    const play = pickExpertPlay(state, 0);
    expect(play.suit).toBe('hearts');
    expect(play.value).toBe('9');
  });

  it('third seat takes the trick with boss trump when nothing beats it', () => {
    const trump = 'spades' as const;
    const trick = [
      { playerId: 2, card: createCard('clubs', '10') },
      { playerId: 3, card: createCard('clubs', 'A') },
    ];
    const state = {
      phase: 'playing',
      trump,
      leadSuit: 'clubs' as const,
      currentTrick: trick,
      cardsPlayed: [
        createCard('clubs', 'J'),
        createCard('spades', 'A'),
        createCard('spades', 'K'),
        createCard('spades', 'Q'),
        createCard('spades', '10'),
        createCard('spades', '9'),
      ],
      makerTeam: 1,
      goAlone: false,
      lonerId: null,
      dealerId: 1,
      tricksWon: { 0: 0, 1: 0 },
      players: [
        {
          id: 0,
          name: 'P',
          isHuman: false,
          team: 0,
          cards: [createCard('spades', 'J'), createCard('hearts', '9')],
        },
        { id: 1, name: 'D', isHuman: false, team: 1, cards: [] },
        { id: 2, name: 'L', isHuman: false, team: 0, cards: [] },
        { id: 3, name: 'O', isHuman: false, team: 1, cards: [] },
      ],
      currentPlayer: 0,
    } as GameState;

    const play = pickExpertPlay(state, 0);
    expect(play.suit).toBe('spades');
    expect(play.value).toBe('J');
  });
});
