import { describe, expect, it } from 'vitest';
import {
  clampTrumpPillLayout,
  defaultTrumpPillLayout,
  nearestSnap,
  resolveTrumpPillCenter,
  snapPointsFromRects,
} from '../trumpPillLayout';

describe('trumpPillLayout', () => {
  it('resolves snapped position from anchor offset', () => {
    const points = snapPointsFromRects({
      score: { left: 100, top: 10, right: 300, bottom: 50, width: 200, height: 40 } as DOMRect,
      log: null,
      hud: null,
    });
    const layout = clampTrumpPillLayout({
      snapId: 'score-right',
      x: 8,
      y: -2,
      scale: 1,
    });
    const center = resolveTrumpPillCenter(layout, points);
    expect(center.x).toBe(314);
    expect(center.y).toBe(28);
  });

  it('snaps when drag ends within radius', () => {
    const points = snapPointsFromRects({
      score: { left: 100, top: 10, right: 300, bottom: 50, width: 200, height: 40 } as DOMRect,
      log: null,
      hud: null,
    });
    const hit = nearestSnap(305, 30, points);
    expect(hit?.snapId).toBe('score-right');
  });

  it('defaults include scale', () => {
    const d = defaultTrumpPillLayout();
    expect(d.scale).toBeGreaterThanOrEqual(0.65);
  });
});
