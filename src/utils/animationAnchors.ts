export function queryAnchorCenter(selector: string): { x: number; y: number } | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function seatAnchorCenter(seatIndex: number): { x: number; y: number } | null {
  return queryAnchorCenter(`[data-anim-anchor="player-${seatIndex}"]`);
}

export function tableCenterAnchor(): { x: number; y: number } | null {
  return queryAnchorCenter('[data-anim-anchor="table-center"]');
}

export function humanHandAnchor(): { x: number; y: number } | null {
  return queryAnchorCenter('[data-anim-anchor="human-hand"]');
}

/** Euchre deal order: one card at a time clockwise from left of dealer. */
export function dealSeatOrder(dealerId: number, cardIndex: number): number {
  const start = (dealerId + 1) % 4;
  return (start + cardIndex) % 4;
}
