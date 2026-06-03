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

export function fanContainerSize(cardCount: number): { width: number; height: number } {
  return {
    width: Math.max(200, cardCount * 36 + 88),
    height: 118,
  };
}
