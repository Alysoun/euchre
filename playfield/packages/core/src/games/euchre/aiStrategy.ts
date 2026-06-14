import type { Card, GameState, Suit, TeamId, TrickPlay } from './types';
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
import {
  filterSafeWinners,
  gatherPlayedCards,
  opponentsStillToAct,
} from './aiPlayMemory';

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

function trumpCount(hand: Card[], trump: Suit): number {
  return hand.filter((c) => effectiveSuit(c, trump) === trump).length;
}

function hasBower(hand: Card[], trump: Suit): boolean {
  return hand.some((c) => isRightBower(c, trump) || isLeftBower(c, trump));
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

const BASE_ORDER_THRESHOLDS: Record<EuchreAIDifficulty, number> = {
  easy: 3.75,
  medium: 5.25,
  hard: 6.25,
};

const BASE_NAME_THRESHOLDS: Record<EuchreAIDifficulty, number> = {
  easy: 3.25,
  medium: 4.75,
  hard: 5.75,
};

/** Extra margin when the dealer — not the caller — receives the turned card. */
const NON_DEALER_ORDER_MARGIN: Record<EuchreAIDifficulty, number> = {
  easy: 0.75,
  medium: 1.35,
  hard: 2,
};

function bidThresholdAdjust(
  team: TeamId,
  score: Record<TeamId, number>,
  difficulty: EuchreAIDifficulty
): number {
  const us = score[team];
  const them = score[(1 - team) as TeamId];
  let adjust = 0;
  if (us >= 8) adjust += difficulty === 'hard' ? 0.9 : 0.55;
  if (us >= 9) adjust += 0.55;
  if (them >= 8 && us + 2 <= them) adjust -= difficulty === 'hard' ? 0.35 : 0.2;
  return adjust;
}

function orderUpThreshold(
  callerIsDealer: boolean,
  team: TeamId,
  teamScore: Record<TeamId, number>,
  difficulty: EuchreAIDifficulty
): number {
  let threshold = BASE_ORDER_THRESHOLDS[difficulty];
  if (!callerIsDealer) threshold += NON_DEALER_ORDER_MARGIN[difficulty];
  threshold += bidThresholdAdjust(team, teamScore, difficulty);
  return threshold;
}

function nameTrumpThreshold(
  team: TeamId,
  teamScore: Record<TeamId, number>,
  difficulty: EuchreAIDifficulty
): number {
  return BASE_NAME_THRESHOLDS[difficulty] + bidThresholdAdjust(team, teamScore, difficulty);
}

function ownHandSupportsOrderUp(hand: Card[], trump: Suit): boolean {
  const trumps = trumpCount(hand, trump);
  if (trumps >= 2) return true;
  if (trumps >= 1 && hasBower(hand, trump)) return true;
  return false;
}

export function shouldOrderUp(
  hand: Card[],
  turnedCard: Card,
  callerId: number,
  dealerId: number,
  teamScore: Record<TeamId, number>,
  difficulty: EuchreAIDifficulty
): boolean {
  const trump = turnedCard.suit;
  const callerIsDealer = callerId === dealerId;
  const evalHand = callerIsDealer ? [...hand, turnedCard] : hand;
  const score = trumpHandScore(evalHand, trump);
  const threshold = orderUpThreshold(
    callerIsDealer,
    playerTeam(callerId) as TeamId,
    teamScore,
    difficulty
  );

  if (!callerIsDealer && !ownHandSupportsOrderUp(hand, trump)) return false;

  return score >= threshold;
}

export function shouldNameTrump(
  hand: Card[],
  turnedSuit: Suit | null,
  playerId: number,
  teamScore: Record<TeamId, number>,
  difficulty: EuchreAIDifficulty
): { suit: Suit } | null {
  const best = bestNameTrumpSuit(hand, turnedSuit);
  if (!best) return null;
  const threshold = nameTrumpThreshold(playerTeam(playerId) as TeamId, teamScore, difficulty);
  if (best.score < threshold) return null;
  return { suit: best.suit };
}

/** Dealer must name trump — pick the strongest eligible suit (no pass). */
export function pickForcedNameTrump(hand: Card[], turnedSuit: Suit | null): Suit {
  const best = bestNameTrumpSuit(hand, turnedSuit);
  if (best) return best.suit;
  return SUITS.find((suit) => suit !== turnedSuit) ?? SUITS[0];
}

/** Lone hands need both bowers and enough trump to march — rare even on hard. */
export function shouldGoAlone(
  hand: Card[],
  trump: Suit,
  difficulty: EuchreAIDifficulty
): boolean {
  if (difficulty !== 'hard') return false;
  const score = trumpHandScore(hand, trump);
  const hasRight = hand.some((c) => isRightBower(c, trump));
  const hasLeft = hand.some((c) => isLeftBower(c, trump));
  const trumps = trumpCount(hand, trump);

  if (!hasRight || !hasLeft) return false;
  if (trumps >= 4 && score >= 11.75) return true;
  if (trumps >= 3 && score >= 12.25) return true;
  return false;
}

/**
 * Go alone on order-up only when the caller is dealer and picks up the turned card.
 * Ordering partner up and going alone gives the kitty to your partner, not you.
 */
export function shouldGoAloneOnOrderUp(
  hand: Card[],
  turnedCard: Card,
  trump: Suit,
  callerIsDealer: boolean,
  difficulty: EuchreAIDifficulty
): boolean {
  if (difficulty !== 'hard' || !callerIsDealer) return false;
  return shouldGoAlone([...hand, turnedCard], trump, difficulty);
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
  const makerTricks = state.makerTeam !== null ? state.tricksWon[state.makerTeam] : 0;

  if (state.goAlone && state.lonerId === playerId) {
    const right = hand.find((c) => isRightBower(c, trump));
    if (right) return right;
    const left = hand.find((c) => isLeftBower(c, trump));
    if (left) return left;
    if (trumps.length > 0) {
      return sortByStrength(trumps, trump, leadSuit, true)[0];
    }
  }

  const singletonAces = offTrump.filter((c) => {
    if (c.value !== 'A') return false;
    const suit = effectiveSuit(c, trump);
    return hand.filter((h) => effectiveSuit(h, trump) === suit).length === 1;
  });
  if (singletonAces.length > 0) {
    return sortByStrength(singletonAces, trump, leadSuit, true)[0];
  }

  const isMaker = state.makerTeam === playerTeam(playerId);
  if (isMaker && trumps.length >= 2 && makerTricks === 0) {
    return sortByStrength(trumps, trump, leadSuit, true)[0];
  }
  if (isMaker && trumps.length === 1 && makerTricks < 3 && offTrump.length > 0) {
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

function sloughLowest(
  legal: Card[],
  trump: Suit,
  leadSuit: Suit,
  exclude?: Card[]
): Card {
  const pool =
    exclude && exclude.length > 0
      ? legal.filter((c) => !exclude.some((x) => x.id === c.id))
      : legal;
  if (pool.length === 0) return sortByStrength(legal, trump, leadSuit, true)[0];
  const offTrump = pool.filter((c) => effectiveSuit(c, trump) !== trump);
  const discard = offTrump.length > 0 ? offTrump : pool;
  return sortByStrength(discard, trump, leadSuit, true)[0];
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
  const defendingLoner =
    state.goAlone &&
    state.lonerId !== null &&
    playerTeam(state.lonerId) !== playerTeam(playerId);

  if (partnerWinning) {
    return sloughLowest(legal, trump, leadSuit);
  }

  const played = gatherPlayedCards(state);
  const myHand = state.players[playerId].cards;
  const opponentsStill = opponentsStillToAct(state, playerId, trick);

  const winners = legal.filter((c) => cardWinsIfPlayed(c, playerId, trick, trump, leadSuit));
  if (winners.length > 0) {
    if (defendingLoner) {
      return sortByStrength(winners, trump, leadSuit, false)[0];
    }
    const makerTeam = state.makerTeam;
    const isDefender =
      makerTeam !== null && playerTeam(playerId) !== makerTeam;

    let pool = winners;
    const safe = filterSafeWinners(
      winners,
      trump,
      leadSuit,
      played,
      myHand,
      opponentsStill
    );
    if (safe.length > 0) {
      pool = safe;
    } else if (opponentsStill.length > 0) {
      return sloughLowest(legal, trump, leadSuit, winners);
    }

    if (isDefender && pool.some((c) => effectiveSuit(c, trump) === trump)) {
      return sortByStrength(
        pool.filter((c) => effectiveSuit(c, trump) === trump),
        trump,
        leadSuit,
        true
      )[0];
    }
    return sortByStrength(pool, trump, leadSuit, true)[0];
  }

  return sloughLowest(legal, trump, leadSuit);
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
    if (roll < 0.015) return randomPick(legal.filter((c) => c.id !== expertCard.id) || legal);
    return expertCard;
  }
  if (difficulty === 'medium') {
    if (roll < 0.08) return randomPick(legal);
    return expertCard;
  }
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
  turnedCard: Card,
  callerId: number,
  dealerId: number,
  teamScore: Record<TeamId, number>,
  difficulty: EuchreAIDifficulty
): boolean {
  const trump = turnedCard.suit;
  const callerIsDealer = callerId === dealerId;
  const evalHand = callerIsDealer ? [...hand, turnedCard] : hand;
  const score = trumpHandScore(evalHand, trump);
  const roll = Math.random();
  if (difficulty === 'easy') {
    if (wouldOrder && roll < 0.28) return false;
    if (!wouldOrder && score >= 2.5 && roll < 0.2) return true;
    return wouldOrder;
  }
  if (difficulty === 'medium') {
    if (wouldOrder && score < 5.5 && roll < 0.12) return false;
    return wouldOrder;
  }
  if (wouldOrder && !callerIsDealer && score < 8.5 && roll < 0.08) return false;
  if (!wouldOrder && score >= BASE_ORDER_THRESHOLDS.hard + 1.5 && roll < 0.02) return true;
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
    if (!pick && best && best.score >= 2.5 && roll < 0.16) return { suit: best.suit };
    return pick;
  }
  if (difficulty === 'medium') {
    if (pick && best && best.score < 5 && roll < 0.1) return null;
    return pick;
  }
  return pick;
}

export {
  allEffectiveTrumpCards,
  anyUnaccountedTrump,
  couldOpponentsStillBeat,
  filterSafeWinners,
  gatherPlayedCards,
  isBossTrump,
  opponentsStillToAct,
} from './aiPlayMemory';
