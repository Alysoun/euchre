import { shuffle } from '../../deck/standard52';
import type { Card, EuchreRank, Suit } from './types';
import { RANKS, SUITS, SUIT_SYMBOL } from './constants';

const RANK_ORDER: Record<EuchreRank, number> = {
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function cardId(suit: Suit, value: EuchreRank): string {
  return `${suit}-${value}`;
}

export function createCard(suit: Suit, value: EuchreRank): Card {
  return { suit, value, id: cardId(suit, value) };
}

export function createEuchreDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of RANKS) {
      deck.push(createCard(suit, value));
    }
  }
  return deck;
}

export { shuffle };

export function sameColorSuit(suit: Suit): Suit {
  if (suit === 'hearts') return 'diamonds';
  if (suit === 'diamonds') return 'hearts';
  if (suit === 'clubs') return 'spades';
  return 'clubs';
}

export function effectiveSuit(card: Card, trump: Suit): Suit {
  if (card.value === 'J' && card.suit === sameColorSuit(trump)) return trump;
  return card.suit;
}

export function isRightBower(card: Card, trump: Suit): boolean {
  return card.value === 'J' && card.suit === trump;
}

export function isLeftBower(card: Card, trump: Suit): boolean {
  return card.value === 'J' && card.suit === sameColorSuit(trump);
}

export function trickStrength(card: Card, trump: Suit, leadSuit: Suit): number {
  if (isRightBower(card, trump)) return 100;
  if (isLeftBower(card, trump)) return 99;
  if (card.suit === trump) return 50 + RANK_ORDER[card.value];
  if (effectiveSuit(card, trump) === leadSuit) return RANK_ORDER[card.value];
  return 0;
}

export function removeCard(hand: Card[], card: Card): Card[] {
  return hand.filter((c) => c.id !== card.id);
}

export function hasCard(hand: Card[], card: Card): boolean {
  return hand.some((c) => c.id === card.id);
}

export function rankValue(value: EuchreRank): number {
  return RANK_ORDER[value];
}

/** Human-readable card label for logs (marks bowers when trump is known). */
export function formatCardForLog(card: Card, trump: Suit): string {
  const label = `${card.value}${SUIT_SYMBOL[card.suit]}`;
  if (isRightBower(card, trump)) return `${label} (right bower)`;
  if (isLeftBower(card, trump)) return `${label} (left bower)`;
  return label;
}

export { RANK_ORDER };
