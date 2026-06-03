import { describe, expect, it } from 'vitest';
import { createCard } from '../cards';
import { trickLeader } from '../trickPlay';
import {
  pickExpertPlay,
  shouldGoAlone,
  shouldGoAloneOnOrderUp,
  shouldOrderUp,
  trumpHandScore,
} from '../aiStrategy';
import type { GameState } from '../types';

describe('aiStrategy', () => {
  it('scores bowers highly', () => {
    const trump = 'hearts' as const;
    const hand = [
      createCard('hearts', 'J'),
      createCard('diamonds', 'J'),
      createCard('hearts', 'A'),
      createCard('clubs', '9'),
      createCard('spades', '9'),
    ];
    expect(trumpHandScore(hand, trump)).toBeGreaterThan(10);
    expect(shouldOrderUp(hand, trump, 'hard')).toBe(true);
  });

  it('partner-winning trick ducks low', () => {
    const trump = 'hearts' as const;
    const trick = [
      { playerId: 0, card: createCard('hearts', 'A') },
      { playerId: 1, card: createCard('hearts', '10') },
    ];
    const state = {
      phase: 'playing',
      trump,
      leadSuit: 'hearts' as const,
      currentTrick: trick,
      makerTeam: 0,
      tricksWon: { 0: 0, 1: 0 },
      players: [
        { id: 0, name: 'A', isHuman: false, team: 0, cards: [] },
        { id: 1, name: 'B', isHuman: false, team: 1, cards: [] },
        {
          id: 2,
          name: 'P',
          isHuman: false,
          team: 0,
          cards: [createCard('hearts', '9'), createCard('diamonds', 'K')],
        },
        { id: 3, name: 'D', isHuman: false, team: 1, cards: [] },
      ],
      currentPlayer: 2,
    } as GameState;

    const play = pickExpertPlay(state, 2);
    expect(play.value).toBe('9');
    expect(play.suit).toBe('hearts');
  });

  it('trickLeader picks right bower over ace trump', () => {
    const trump = 'hearts' as const;
    const trick = [
      { playerId: 0, card: createCard('hearts', 'A') },
      { playerId: 1, card: createCard('hearts', 'J') },
    ];
    expect(trickLeader(trick, trump, 'hearts').playerId).toBe(1);
  });

  it('only goes alone on near-march hands at hard difficulty', () => {
    const trump = 'diamonds' as const;
    const decent = [
      createCard('diamonds', 'A'),
      createCard('diamonds', 'K'),
      createCard('diamonds', '10'),
      createCard('clubs', '9'),
      createCard('spades', '9'),
    ];
    expect(shouldGoAlone(decent, trump, 'hard')).toBe(false);

    const march = [
      createCard('diamonds', 'J'),
      createCard('clubs', 'J'),
      createCard('diamonds', 'A'),
      createCard('diamonds', 'K'),
      createCard('diamonds', '10'),
    ];
    expect(trumpHandScore(march, trump)).toBeGreaterThan(10);
    expect(shouldGoAlone(march, trump, 'hard')).toBe(true);
  });

  it('does not treat the kitty as loner hand when caller is not dealer', () => {
    const trump = 'diamonds' as const;
    const turned = createCard('diamonds', 'K');
    const hand = [
      createCard('diamonds', 'J'),
      createCard('hearts', 'J'),
      createCard('diamonds', 'A'),
      createCard('spades', '9'),
      createCard('clubs', '9'),
    ];
    expect(
      shouldGoAloneOnOrderUp(hand, turned, trump, false, 'hard')
    ).toBe(true);
    const withoutLeft = [
      createCard('diamonds', 'J'),
      createCard('diamonds', 'A'),
      createCard('spades', '9'),
      createCard('hearts', '9'),
      createCard('clubs', '9'),
    ];
    expect(
      shouldGoAloneOnOrderUp(withoutLeft, turned, trump, false, 'hard')
    ).toBe(false);
  });
});
