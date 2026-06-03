export type CardStackState = {
  index: number;
  total: number;
  dragging?: boolean;
  playable?: boolean;
  hovered?: boolean;
};

export function computeCardStackZ({
  index,
  total,
  playable,
  hovered,
}: CardStackState): number {
  let z = 10 + index;
  if (playable) z += total + 5;
  if (hovered) z += total * 2 + 10;
  return z;
}

export function cardFanTransform(index: number, total: number, lifted: boolean): string {
  const mid = (total - 1) / 2;
  const offset = index - mid;
  const angle = offset * 14;
  const arcY = -Math.abs(offset) * 4;
  const spreadX = offset * 24;
  const lift = lifted ? -20 : 0;
  const depth = index * 4;
  return `translateX(calc(-50% + ${spreadX}px)) rotate(${angle}deg) translateY(${arcY + lift}px) translateZ(${depth}px)`;
}

export const FAN_HOVER_HEADROOM_PX = 24;

export function fanContainerSize(
  cardCount: number,
  cardBasePx = 72
): { width: number; height: number } {
  const scale = cardBasePx / 72;
  return {
    width: Math.max(200 * scale, cardCount * 36 * scale + 88 * scale),
    height: Math.round(118 * scale),
  };
}

/** Layout box for a scaled hand fan — outer size grows with scale so HUD text stays visible. */
export function scaledFanLayoutSize(
  cardCount: number,
  handScale: number,
  cardBasePx = 72
): { baseWidth: number; baseHeight: number; width: number; height: number } {
  const base = fanContainerSize(cardCount, cardBasePx);
  const baseHeight = base.height + FAN_HOVER_HEADROOM_PX;
  return {
    baseWidth: base.width,
    baseHeight,
    width: Math.ceil(base.width * handScale),
    height: Math.ceil(baseHeight * handScale),
  };
}
