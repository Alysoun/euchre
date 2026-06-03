import type { Suit } from './types';

export const PLAYER_COUNT = 4;
export const CARDS_PER_HAND = 5;
export const WINNING_SCORE = 10;
export const TURN_MS = 15_000;

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['9', '10', 'J', 'Q', 'K', 'A'] as const;

export const PHASE_LABELS: Record<string, string> = {
  setup: 'Setup',
  bidding: 'Bidding — order up?',
  biddingRound2: 'Bidding — name trump',
  dealerDiscard: 'Dealer discard',
  playing: 'Trick play',
  handSummary: 'Hand complete',
  gameOver: 'Game over',
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};
