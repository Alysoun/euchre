import { describe, expect, it } from 'vitest';
import {
  tableTiltDeg,
  trickCardLocalRotateXDeg,
  trickLayerCounterRotateXDeg,
} from '../feltCardTransform';

describe('trick card facing player', () => {
  it('fully counters table tilt at 100% facePlayer', () => {
    expect(trickLayerCounterRotateXDeg(100)).toBe(-tableTiltDeg);
    expect(trickCardLocalRotateXDeg(100)).toBeCloseTo(0);
  });

  it('uses felt lean at 0% with no layer counter-rotate', () => {
    expect(trickLayerCounterRotateXDeg(0)).toBeCloseTo(0);
    expect(trickCardLocalRotateXDeg(0)).toBe(-(tableTiltDeg - 8));
  });
});
