import type { Card, GameState, Suit, TrickPlay } from './types';
import { SUITS } from './constants';
import {
  effectiveSuit,
  isLeftBower,
  isRightBower,
  rankValue,
  trickStrength,
} from './cards';
import { getLegalPlays, trickLeader } from './trickPlay';
import { partnerId, playerTeam } from './teams';
import type { EuchreAIDifficulty } from './aiDifficulty';

/** Trump strength score for bidding (higher = stronger call). */
export function trumpHandScore(hand: Card[], trump: Suit): number {
  let score = 0;
  for (const card of hand) {
    if (isRightBower(card, trump)) score += 6;
    else if (isLeftBower(card, trump)) score += 5;
    else if (card.suit === trump) score += rankValue(card.value) / 3;
    else if (card.value === 'A') score += 0.75;
    else if (card.value === 'K') score += 0.35;
  }
  return score;
}

function turnedSuitTrumpScore(hand: Card[], turnedSuit: Suit): number {
  return trumpHandScore(hand, turnedSuit);
}

export function bestNameTrumpSuit(
  hand: Card[],
  excludeSuit: Suit | null
): { suit: Suit; score: number } | null {
  let best: { suit: Suit; score: number } | null = null;
  for (const suit of SUITS) {
    if (suit === excludeSuit) continue;
    const score = trumpHandScore(hand, suit);
    if (!best || score > best.score) {
      best = { suit, score };
    }
  }
  return best;
}

const ORDER_THRESHOLDS: Record<EuchreAIDifficulty, number> = {
  easy: 3.5,
  medium: 4.5,
  hard: 5.5,
};

const NAME_THRESHOLDS: Record<EuchreAIDifficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

const LONE_THRESHOLDS: Record<EuchreAIDifficulty, number> = {
  easy: 99,
  medium: 99,
  hard: 8.5,
};

export function shouldOrderUp(
  hand: Card[],
  turnedSuit: Suit,
  difficulty: EuchreAIDifficulty
): boolean {
  const score = turnedSuitTrumpScore(hand, turnedSuit);
  return score >= ORDER_THRESHOLDS[difficulty];
}

export function shouldNameTrump(
  hand: Card[],
  turnedSuit: Suit | null,
  difficulty: EuchreAIDifficulty
): { suit: Suit } | null {
  const best = bestNameTrumpSuit(hand, turnedSuit);
  if (!best || best.score < NAME_THRESHOLDS[difficulty]) return null;
  return { suit: best.suit };
}

export function shouldGoAlone(
  hand: Card[],
  trump: Suit,
  difficulty: EuchreAIDifficulty
): boolean {
  if (difficulty !== 'hard') return false;
  return trumpHandScore(hand, trump) >= LONE_THRESHOLDS[difficulty];
}

export function pickDiscard(hand: Card[], trump: Suit): Card {
  const sorted = [...hand].sort((a, b) => {
    const aTrump = effectiveSuit(a, trump) === trump;
    const bTrump = effectiveSuit(b, trump) === trump;
    if (aTrump !== bTrump) return aTrump ? 1 : -1;
    return rankValue(a.value) - rankValue(b.value);
  });
  return sorted[0];
}

function resolvedLeadSuit(trick: TrickPlay[], trump: Suit, leadSuit: Suit | null): Suit {
  if (leadSuit) return leadSuit;
  if (trick.length > 0) return effectiveSuit(trick[0].card, trump);
  return trump;
}

function cardWinsIfPlayed(
  card: Card,
  playerId: number,
  trick: TrickPlay[],
  trump: Suit,
  leadSuit: Suit
): boolean {
  const hypothetical: TrickPlay[] = [...trick, { playerId, card }];
  return trickLeader(hypothetical, trump, leadSuit).playerId === playerId;
}

function sortByStrength(cards: Card[], trump: Suit, leadSuit: Suit, asc = true): Card[] {
  return [...cards].sort((a, b) => {
    const da = trickStrength(a, trump, leadSuit);
    const db = trickStrength(b, trump, leadSuit);
    return asc ? da - db : db - da;
  });
}

function pickLead(hand: Card[], trump: Suit, state: GameState, playerId: number): Card {
  const leadSuit = trump;
  const trumps = hand.filter((c) => effectiveSuit(c, trump) === trump);
  const offTrump = hand.filter((c) => effectiveSuit(c, trump) !== trump);

  const singletonAces = offTrump.filter((c) => {
    if (c.value !== 'A') return false;
    const suit = effectiveSuit(c, trump);
    return hand.filter((h) => effectiveSuit(h, trump) === suit).length === 1;
  });
  if (singletonAces.length > 0) {
    return sortByStrength(singletonAces, trump, leadSuit, true)[0];
  }

  const isMaker = state.makerTeam === playerTeam(playerId);
  if (isMaker && trumps.length > 0 && state.tricksWon[state.makerTeam!] < 3) {
    return sortByStrength(trumps, trump, leadSuit, true)[0];
  }

  if (offTrump.length > 0) {
    const bySuit = new Map<Suit, Card[]>();
    for (const c of offTrump) {
      const s = effectiveSuit(c, trump);
      const list = bySuit.get(s) ?? [];
      list.push(c);
      bySuit.set(s, list);
    }
    let shortest: Card[] | null = null;
    for (const list of bySuit.values()) {
      if (!shortest || list.length < shortest.length) shortest = list;
    }
    if (shortest) return sortByStrength(shortest, trump, leadSuit, true)[0];
  }

  if (trumps.length > 0) return sortByStrength(trumps, trump, leadSuit, true)[0];
  return hand[0];
}

function pickFollow(
  state: GameState,
  playerId: number,
  hand: Card[],
  trick: TrickPlay[],
  trump: Suit,
  leadSuit: Suit
): Card {
  const legal = getLegalPlays(hand, trick, trump, leadSuit);
  const partner = partnerId(playerId);
  const leader = trick.length > 0 ? trickLeader(trick, trump, leadSuit) : null;
  const partnerWinning = leader?.playerId === partner;

  if (partnerWinning) {
    return sortByStrength(legal, trump, leadSuit, true)[0];
  }

  const winners = legal.filter((c) => cardWinsIfPlayed(c, playerId, trick, trump, leadSuit));
  if (winners.length > 0) {
    return sortByStrength(winners, trump, leadSuit, true)[0];
  }

  return sortByStrength(legal, trump, leadSuit, true)[0];
}

export function pickExpertPlay(state: GameState, playerId: number): Card {
  const player = state.players[playerId];
  const trump = state.trump!;
  const trick = state.currentTrick;
  const leadSuit = resolvedLeadSuit(trick, trump, state.leadSuit);
  const legal = getLegalPlays(player.cards, trick, trump, state.leadSuit);
  if (legal.length === 0) return player.cards[0];

  if (trick.length === 0) {
    return pickLead(legal, trump, state, playerId);
  }
  return pickFollow(state, playerId, legal, trick, trump, leadSuit);
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Occasionally diverge from expert line for easier tables. */
export function applyDifficultyToPlay(
  expertCard: Card,
  state: GameState,
  playerId: number,
  difficulty: EuchreAIDifficulty
): Card {
  const player = state.players[playerId];
  const legal = getLegalPlays(
    player.cards,
    state.currentTrick,
    state.trump!,
    state.leadSuit
  );
  if (legal.length <= 1) return expertCard;

  const roll = Math.random();
  if (difficulty === 'hard') {
    if (roll < 0.04) return randomPick(legal.filter((c) => c.id !== expertCard.id) || legal);
    return expertCard;
  }
  if (difficulty === 'medium') {
    if (roll < 0.1) return randomPick(legal);
    return expertCard;
  }
  // easy — noticeable mistakes
  if (roll < 0.38) return randomPick(legal);
  if (roll < 0.52) {
    const sorted = sortByStrength(
      legal,
      state.trump!,
      resolvedLeadSuit(state.currentTrick, state.trump!, state.leadSuit),
      false
    );
    return sorted[0];
  }
  return expertCard;
}

export function applyDifficultyToOrderUp(
  wouldOrder: boolean,
  hand: Card[],
  turnedSuit: Suit,
  difficulty: EuchreAIDifficulty
): boolean {
  const score = turnedSuitTrumpScore(hand, turnedSuit);
  const roll = Math.random();
  if (difficulty === 'easy') {
    if (wouldOrder && roll < 0.28) return false;
    if (!wouldOrder && score >= 2 && roll < 0.22) return true;
    return wouldOrder;
  }
  if (difficulty === 'medium') {
    if (wouldOrder && score < 5 && roll < 0.12) return false;
    return wouldOrder;
  }
  if (!wouldOrder && score >= ORDER_THRESHOLDS.hard - 0.5 && roll < 0.08) return true;
  return wouldOrder;
}

export function applyDifficultyToNameTrump(
  pick: { suit: Suit } | null,
  hand: Card[],
  turnedSuit: Suit | null,
  difficulty: EuchreAIDifficulty
): { suit: Suit } | null {
  const best = bestNameTrumpSuit(hand, turnedSuit);
  const roll = Math.random();
  if (difficulty === 'easy') {
    if (pick && roll < 0.3) return null;
    if (!pick && best && best.score >= 2 && roll < 0.18) return { suit: best.suit };
    return pick;
  }
  if (difficulty === 'medium') {
    if (pick && best && best.score < 4.5 && roll < 0.1) return null;
    return pick;
  }
  return pick;
}
