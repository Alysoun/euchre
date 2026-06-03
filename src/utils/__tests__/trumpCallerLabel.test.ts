import { describe, expect, it } from 'vitest';
import { trumpCallerShortLabel, trumpCallerSeatHint } from '../trumpCallerLabel';
import type { GameState } from '../../types/GameTypes';

describe('trumpCallerLabel', () => {
  const players = [
    { id: 0, name: 'Mike', isHuman: true, cards: [], team: 0 as const },
    { id: 1, name: 'Elaine', isHuman: false, cards: [], team: 1 as const },
  ];

  it('labels order up caller', () => {
    const label = trumpCallerShortLabel({
      trumpCallerId: 1,
      trumpCallKind: 'orderUp',
      goAlone: false,
      players,
    } as Pick<GameState, 'trumpCallerId' | 'trumpCallKind' | 'goAlone' | 'players'>);
    expect(label).toContain('ordered up');
    expect(label).toContain('Elaine');
  });

  it('seat hint for alone', () => {
    expect(trumpCallerSeatHint({ trumpCallKind: 'nameTrump', goAlone: true })).toBe(
      'Going alone'
    );
  });
});
