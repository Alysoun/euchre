/** Default center of played cards on the felt (% of table layer). */
export const TRICK_CENTER_TOP_PCT = 52;
export const TRICK_CENTER_LEFT_PCT = 50;

/** Base fan offsets (px) — multiplied by `spread` from stored layout. */
export const TRICK_FAN_BASE: Record<number, { dx: number; dy: number }> = {
  0: { dx: 0, dy: 72 },
  1: { dx: -88, dy: 12 },
  2: { dx: 0, dy: -64 },
  3: { dx: 88, dy: 12 },
};

export const BASE_TRICK_CARD_PX = 64;

export type TrickLayout = {
  offsetX: number;
  offsetY: number;
  spread: number;
  cardScale: number;
  /** 0 = slight felt lean, 100 = face toward bottom player (readable). */
  facePlayer: number;
};

export const MIN_TRICK_OFFSET_X = -72;
export const MAX_TRICK_OFFSET_X = 72;
export const MIN_TRICK_OFFSET_Y = -48;
export const MAX_TRICK_OFFSET_Y = 96;
export const MIN_TRICK_SPREAD = 0.7;
export const MAX_TRICK_SPREAD = 1.4;
export const MIN_TRICK_CARD_SCALE = 0.7;
export const MAX_TRICK_CARD_SCALE = 1.35;
export const MIN_TRICK_FACE_PLAYER = 0;
export const MAX_TRICK_FACE_PLAYER = 100;

/** @deprecated migrated to facePlayer */
function migrateTiltAdjust(tiltAdjust: number | undefined): number | undefined {
  if (typeof tiltAdjust !== 'number') return undefined;
  return Math.min(100, Math.max(0, 50 + tiltAdjust * 0.5));
}

export function defaultTrickLayout(): TrickLayout {
  return {
    offsetX: 0,
    offsetY: 12,
    spread: 1,
    cardScale: 1,
    facePlayer: 100,
  };
}

export function clampTrickLayout(layout: Partial<TrickLayout> | TrickLayout): TrickLayout {
  const base = defaultTrickLayout();
  return {
    offsetX: Math.min(
      MAX_TRICK_OFFSET_X,
      Math.max(MIN_TRICK_OFFSET_X, layout.offsetX ?? base.offsetX)
    ),
    offsetY: Math.min(
      MAX_TRICK_OFFSET_Y,
      Math.max(MIN_TRICK_OFFSET_Y, layout.offsetY ?? base.offsetY)
    ),
    spread: Math.min(MAX_TRICK_SPREAD, Math.max(MIN_TRICK_SPREAD, layout.spread ?? base.spread)),
    cardScale: Math.min(
      MAX_TRICK_CARD_SCALE,
      Math.max(MIN_TRICK_CARD_SCALE, layout.cardScale ?? base.cardScale)
    ),
    facePlayer: Math.min(
      MAX_TRICK_FACE_PLAYER,
      Math.max(
        MIN_TRICK_FACE_PLAYER,
        layout.facePlayer ??
          migrateTiltAdjust(
            (layout as Partial<TrickLayout> & { tiltAdjust?: number }).tiltAdjust
          ) ??
          base.facePlayer
      )
    ),
  };
}

export function trickFanOffset(
  playerId: number,
  spread: number
): { dx: number; dy: number } {
  const base = TRICK_FAN_BASE[playerId] ?? { dx: 0, dy: 0 };
  return { dx: base.dx * spread, dy: base.dy * spread };
}
