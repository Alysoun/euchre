function viewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1280;
}

function viewportHeight(): number {
  return typeof window !== 'undefined' ? window.innerHeight : 800;
}

/** Space reserved for layout banner + safe area. */
function layoutBannerTopInset(): number {
  return 80;
}

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

const SCREEN_MARGIN_PX = 44;

export function clampTrumpPillScale(scale: number): number {
  return Math.min(MAX_TRUMP_PILL_SCALE, Math.max(MIN_TRUMP_PILL_SCALE, scale));
}

/** Keep pill center on screen (below layout banner). */
export function clampTrumpPillCenter(x: number, y: number): { x: number; y: number } {
  const w = viewportWidth();
  const h = viewportHeight();
  const top = layoutBannerTopInset();
  return {
    x: Math.min(w - SCREEN_MARGIN_PX, Math.max(SCREEN_MARGIN_PX, x)),
    y: Math.min(h - SCREEN_MARGIN_PX, Math.max(top, y)),
  };
}

/** Rough screen position when snap anchors are not measured yet. */
export function estimatedSnapCenter(snapId: TrumpPillSnapId): { x: number; y: number } {
  const w = viewportWidth();
  const h = viewportHeight();
  const scoreY = 72;
  const hudY = h - Math.max(160, h * 0.22);
  switch (snapId) {
    case 'score-right':
      return { x: w * 0.5 + 150, y: scoreY };
    case 'score-left':
      return { x: w * 0.5 - 150, y: scoreY };
    case 'score-bottom':
      return { x: w * 0.5, y: scoreY + 36 };
    case 'log-tr':
      return { x: Math.min(w - 40, 260), y: 120 };
    case 'log-tl':
      return { x: 40, y: 120 };
    case 'log-br':
      return { x: Math.min(w - 40, 260), y: h * 0.45 };
    case 'log-bl':
      return { x: 40, y: h * 0.45 };
    case 'hud-tl':
      return { x: w * 0.22, y: hudY };
    case 'hud-tc':
      return { x: w * 0.5, y: hudY };
    case 'hud-tr':
      return { x: w * 0.78, y: hudY };
    default:
      return { x: w * 0.5, y: hudY };
  }
}

export function defaultTrumpPillLayout(): TrumpPillLayout {
  const w = viewportWidth();
  const h = viewportHeight();
  const center = clampTrumpPillCenter(w * 0.28, h - Math.max(168, h * 0.24));
  return {
    snapId: null,
    x: center.x,
    y: center.y,
    scale: 1,
  };
}

export function clampTrumpPillLayout(layout: Partial<TrumpPillLayout>): TrumpPillLayout {
  const base = defaultTrumpPillLayout();
  const snapId = layout.snapId !== undefined ? layout.snapId : base.snapId;
  const rawX = layout.x ?? base.x;
  const rawY = layout.y ?? base.y;
  const centered =
    snapId === null
      ? clampTrumpPillCenter(rawX, rawY)
      : { x: rawX, y: rawY };
  return {
    snapId,
    x: centered.x,
    y: centered.y,
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
    return clampTrumpPillCenter(layout.x, layout.y);
  }
  const anchor = points.find((p) => p.id === layout.snapId);
  if (anchor) {
    return clampTrumpPillCenter(anchor.x + layout.x, anchor.y + layout.y);
  }
  const est = estimatedSnapCenter(layout.snapId);
  return clampTrumpPillCenter(est.x + layout.x, est.y + layout.y);
}
