import { describe, expect, it } from 'vitest';
import { allianceLabel, formatHandSummaryDisplay } from '../teamDisplay';
import type { GameState, HandSummary } from '../../types/GameTypes';

const players = [
  { id: 0, name: 'Mike', isHuman: true, cards: [], team: 0 as const },
  { id: 1, name: 'Elaine Recinos', isHuman: false, cards: [], team: 1 as const },
  { id: 2, name: 'Mickie Marques', isHuman: false, cards: [], team: 0 as const },
  { id: 3, name: 'Bronx Knopp', isHuman: false, cards: [], team: 1 as const },
];

describe('teamDisplay', () => {
  it('names your alliance with partner first name', () => {
    expect(allianceLabel({ players }, 0)).toBe('Mike (you) & Mickie');
  });

  it('names opponent alliance', () => {
    expect(allianceLabel({ players }, 1)).toBe('Elaine & Bronx');
  });

  it('formats euchre hand summary with names', () => {
    const handSummary: HandSummary = {
      title: 'Hand complete',
      lines: [],
      outcome: {
        scoringTeam: 1,
        points: 2,
        kind: 'euchre',
        makerTeam: 0,
      },
      tricksWon: { 0: 2, 1: 3 },
      score: { 0: 6, 1: 3 },
    };
    const display = formatHandSummaryDisplay({
      players,
      handSummary,
    } as GameState);
    expect(display?.lines[0]).toContain('Elaine');
    expect(display?.lines[0]).toContain('Bronx');
    expect(display?.lines[0]).not.toContain('You & partner');
  });
});
