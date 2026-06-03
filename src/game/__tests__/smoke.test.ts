import { describe, expect, it } from 'vitest';
import { gameReducer, initialGameState, PHASE_LABELS } from '@playfield/core/euchre';

describe('smoke', () => {
  it('imports @playfield/core/euchre', () => {
    expect(PHASE_LABELS.setup).toBeTruthy();
    const next = gameReducer(initialGameState, { type: 'QUIT_GAME' });
    expect(next.phase).toBe('setup');
  });
});
