import { viewportHeight, viewportWidth } from './hudPanelLayout';

export type TrumpPillSnapId =
  | 'score-right'
  | 'score-left'
  | 'score-bottom'
  | 'log-tr'
  | 'log-tl'
  | 'log-br'
  | 'log-bl'
  | 'hud-tl'
  | 'hud-tc'
  | 'hud-tr';

export type TrumpPillLayout = {
  /** When set, position is snap point + offset. When null, x/y are screen center coords. */
  snapId: TrumpPillSnapId | null;
  x: number;
  y: number;
  scale: number;
};

export const TRUMP_PILL_BASE_PX = 52;
export const MIN_TRUMP_PILL_SCALE = 0.65;
export const MAX_TRUMP_PILL_SCALE = 2.4;
export const TRUMP_PILL_SNAP_RADIUS_PX = 48;

export function clampTrumpPillScale(scale: number): number {
  return Math.min(MAX_TRUMP_PILL_SCALE, Math.max(MIN_TRUMP_PILL_SCALE, scale));
}

export function defaultTrumpPillLayout(): TrumpPillLayout {
  const w = viewportWidth();
  return {
    snapId: 'score-right',
    x: 10,
    y: 0,
    scale: 1,
    ...(w <= 480 ? { snapId: 'score-bottom' as const, x: 0, y: 10 } : {}),
  };
}

export function clampTrumpPillLayout(layout: Partial<TrumpPillLayout>): TrumpPillLayout {
  const base = defaultTrumpPillLayout();
  const snapId = layout.snapId !== undefined ? layout.snapId : base.snapId;
  const w = viewportWidth();
  const h = viewportHeight();
  return {
    snapId,
    x: Math.min(w - 24, Math.max(-120, layout.x ?? base.x)),
    y: Math.min(h - 24, Math.max(-120, layout.y ?? base.y)),
    scale: clampTrumpPillScale(layout.scale ?? base.scale),
  };
}

export type SnapPoint = { id: TrumpPillSnapId; x: number; y: number };

export function snapPointsFromRects(rects: {
  score: DOMRect | null;
  log: DOMRect | null;
  hud: DOMRect | null;
}): SnapPoint[] {
  const points: SnapPoint[] = [];
  const { score, log, hud } = rects;

  if (score) {
    const cy = score.top + score.height / 2;
    points.push(
      { id: 'score-right', x: score.right + 6, y: cy },
      { id: 'score-left', x: score.left - 6, y: cy },
      { id: 'score-bottom', x: score.left + score.width / 2, y: score.bottom + 6 }
    );
  }

  if (log) {
    points.push(
      { id: 'log-tr', x: log.right + 4, y: log.top + 4 },
      { id: 'log-tl', x: log.left - 4, y: log.top + 4 },
      { id: 'log-br', x: log.right + 4, y: log.bottom - 4 },
      { id: 'log-bl', x: log.left - 4, y: log.bottom - 4 }
    );
  }

  if (hud) {
    const top = hud.top;
    points.push(
      { id: 'hud-tl', x: hud.left + 8, y: top - 6 },
      { id: 'hud-tc', x: hud.left + hud.width / 2, y: top - 6 },
      { id: 'hud-tr', x: hud.right - 8, y: top - 6 }
    );
  }

  return points;
}

export function nearestSnap(
  centerX: number,
  centerY: number,
  points: SnapPoint[],
  radius = TRUMP_PILL_SNAP_RADIUS_PX
): { snapId: TrumpPillSnapId; offsetX: number; offsetY: number } | null {
  let best: { snapId: TrumpPillSnapId; dist: number; offsetX: number; offsetY: number } | null =
    null;
  for (const p of points) {
    const dist = Math.hypot(centerX - p.x, centerY - p.y);
    if (dist > radius) continue;
    if (!best || dist < best.dist) {
      best = {
        snapId: p.id,
        dist,
        offsetX: centerX - p.x,
        offsetY: centerY - p.y,
      };
    }
  }
  if (!best) return null;
  return {
    snapId: best.snapId,
    offsetX: best.offsetX,
    offsetY: best.offsetY,
  };
}

export function resolveTrumpPillCenter(
  layout: TrumpPillLayout,
  points: SnapPoint[]
): { x: number; y: number } {
  if (!layout.snapId) {
    return { x: layout.x, y: layout.y };
  }
  const anchor = points.find((p) => p.id === layout.snapId);
  if (!anchor) {
    return { x: layout.x, y: layout.y };
  }
  return { x: anchor.x + layout.x, y: anchor.y + layout.y };
}
