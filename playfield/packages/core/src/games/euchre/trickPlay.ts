import type { Card, Suit, TrickPlay } from './types';
import { effectiveSuit, hasCard, trickStrength } from './cards';

export function getLegalPlays(
  hand: Card[],
  trick: TrickPlay[],
  trump: Suit,
  leadSuit: Suit | null
): Card[] {
  if (trick.length === 0) return [...hand];
  const suitToFollow = leadSuit ?? effectiveSuit(trick[0].card, trump);
  const matching = hand.filter((c) => effectiveSuit(c, trump) === suitToFollow);
  return matching.length > 0 ? matching : [...hand];
}

export function validatePlay(
  hand: Card[],
  card: Card,
  trick: TrickPlay[],
  trump: Suit,
  leadSuit: Suit | null
): boolean {
  if (!hasCard(hand, card)) return false;
  return getLegalPlays(hand, trick, trump, leadSuit).some((c) => c.id === card.id);
}

/** Winning play in a partial or complete trick (1–4 cards). */
export function trickLeader(trick: TrickPlay[], trump: Suit, leadSuit: Suit): TrickPlay {
  if (trick.length === 0) throw new Error('Trick must have at least one card');
  let best = trick[0];
  let bestStrength = trickStrength(best.card, trump, leadSuit);
  for (let i = 1; i < trick.length; i += 1) {
    const strength = trickStrength(trick[i].card, trump, leadSuit);
    if (strength > bestStrength) {
      best = trick[i];
      bestStrength = strength;
    }
  }
  return best;
}

export function trickWinner(
  trick: TrickPlay[],
  trump: Suit,
  leadSuit: Suit
): number {
  if (trick.length !== 4) throw new Error('Trick must have 4 cards');
  return trickLeader(trick, trump, leadSuit).playerId;
}
