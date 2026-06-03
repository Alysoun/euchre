import { describe, expect, it } from 'vitest';
import { trickWinner } from '../trickPlay';
import { createCard } from '../cards';
import { scoreHand } from '../teams';

describe('euchre trick play', () => {
  it('right bower beats ace of trump', () => {
    const trump = 'hearts' as const;
    const trick = [
      { playerId: 0, card: createCard('hearts', 'A') },
      { playerId: 1, card: createCard('hearts', 'J') },
      { playerId: 2, card: createCard('clubs', 'A') },
      { playerId: 3, card: createCard('diamonds', '9') },
    ];
    expect(trickWinner(trick, trump, 'hearts')).toBe(1);
  });

  it('left bower counts as trump', () => {
    const trump = 'hearts' as const;
    const trick = [
      { playerId: 0, card: createCard('diamonds', 'A') },
      { playerId: 1, card: createCard('diamonds', 'J') },
      { playerId: 2, card: createCard('hearts', '9') },
      { playerId: 3, card: createCard('spades', '9') },
    ];
    expect(trickWinner(trick, trump, 'diamonds')).toBe(1);
  });

  it('resolves a three-card lone trick', () => {
    const trump = 'clubs' as const;
    const trick = [
      { playerId: 0, card: createCard('clubs', '9') },
      { playerId: 2, card: createCard('clubs', 'A') },
      { playerId: 3, card: createCard('hearts', '10') },
    ];
    expect(trickWinner(trick, trump, 'clubs')).toBe(2);
  });
});

describe('euchre scoring', () => {
  it('euchres defenders for 2', () => {
    const r = scoreHand(0, { 0: 2, 1: 3 });
    expect(r.team).toBe(1);
    expect(r.points).toBe(2);
    expect(r.kind).toBe('euchre');
  });

  it('awards march for 5 tricks', () => {
    const r = scoreHand(0, { 0: 5, 1: 0 });
    expect(r.points).toBe(2);
  });

  it('awards lone march for 4 points', () => {
    const r = scoreHand(0, { 0: 5, 1: 0 }, { goAlone: true });
    expect(r.points).toBe(4);
  });
});
