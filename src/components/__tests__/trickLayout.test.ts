import { describe, expect, it } from 'vitest';
import { TRICK_FAN_BASE, trickFanOffset } from '../trickLayout';

describe('trickLayout', () => {
  it('keeps each seat at a fixed offset regardless of lone hand', () => {
    const spread = 1.2;
    for (const playerId of [0, 1, 2, 3]) {
      const offset = trickFanOffset(playerId, spread);
      const base = TRICK_FAN_BASE[playerId];
      expect(offset).toEqual({
        dx: base.dx * spread,
        dy: base.dy * spread,
      });
    }
  });
});
