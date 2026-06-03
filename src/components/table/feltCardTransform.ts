import { TABLE_TILT } from './TableScene';

export const tableTiltDeg = parseFloat(TABLE_TILT);

/** Slight lean when cards sit on the tilted felt with no layer counter-rotate. */
export const FELT_CARD_AESTHETIC_ROTATE_X = -(tableTiltDeg - 8);

export const FELT_CARD_ROTATE_X = `${FELT_CARD_AESTHETIC_ROTATE_X}deg`;

export const FELT_CARD_LIFT_Z = '56px';

export const FELT_CARD_ORIGIN = '50% 92%';

export function facePlayerT(facePlayer = 100): number {
  return Math.min(100, Math.max(0, facePlayer)) / 100;
}

/**
 * Counter-rotate the whole trick pile to cancel the table's rotateX(tableTilt).
 * At 100% this is −64° so cards present flat toward the screen.
 */
export function trickLayerCounterRotateXDeg(facePlayer = 100): number {
  return -tableTiltDeg * facePlayerT(facePlayer);
}

/** Per-card lean only needed when the layer is not fully countered. */
export function trickCardLocalRotateXDeg(facePlayer = 100): number {
  return FELT_CARD_AESTHETIC_ROTATE_X * (1 - facePlayerT(facePlayer));
}

export function trickCardTransformOrigin(facePlayer = 100): string {
  return facePlayerT(facePlayer) >= 0.5 ? '50% 50%' : FELT_CARD_ORIGIN;
}

export function trickCardLiftZ(facePlayer = 100): string {
  const baseLift = parseFloat(FELT_CARD_LIFT_Z);
  const extra = facePlayerT(facePlayer) * 28;
  return `${Math.round(baseLift + extra)}px`;
}

export const feltCardTransform = (facePlayer = 100) => {
  const localRot = trickCardLocalRotateXDeg(facePlayer);
  const lift = trickCardLiftZ(facePlayer);
  if (Math.abs(localRot) < 0.01) {
    return `translateZ(${lift})`;
  }
  return `rotateX(${localRot}deg) translateZ(${lift})`;
};
