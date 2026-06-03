import { describe, expect, it } from 'vitest';
import { formatSessionLogText } from '../sessionLogExport';
import { initialGameState } from '@playfield/core/euchre';

describe('sessionLogExport', () => {
  it('formats full session log with header and entries', () => {
    const state = {
      ...initialGameState,
      phase: 'playing' as const,
      roundNumber: 6,
      aiDifficulty: 'hard' as const,
      sessionStartedAt: Date.parse('2026-01-15T12:00:00.000Z'),
      sessionLogDroppedCount: 0,
      score: { 0: 4, 1: 2 },
      players: [
        { id: 0, name: 'Mike', isHuman: true, cards: [], team: 0 as const },
        { id: 1, name: 'Bailey', isHuman: false, cards: [], team: 1 as const },
        { id: 2, name: 'Jolie', isHuman: false, cards: [], team: 0 as const },
        { id: 3, name: 'Corbin', isHuman: false, cards: [], team: 1 as const },
      ],
      sessionLog: [
        { id: '1', message: 'Hand 6 — Corbin deals. Turned: K♦', type: 'info' as const },
        { id: '2', message: 'Jolie Ricks orders up ♦ — going alone', type: 'info' as const },
        { id: '3', message: 'Euchre! Defenders 2 points', type: 'success' as const },
      ],
      log: [{ id: '3', message: 'Euchre! Defenders 2 points', type: 'success' as const }],
    };

    const text = formatSessionLogText(state);
    expect(text).toContain('Euchre — full session log');
    expect(text).toContain('Session log: 3 lines');
    expect(text).toContain('AI difficulty: hard');
    expect(text).toContain('Hand 6 — Corbin deals');
    expect(text).toContain('[+] Euchre! Defenders 2 points');
    expect(text).toContain('Final score: You & partner 4 — Opponents 2');
  });
});
