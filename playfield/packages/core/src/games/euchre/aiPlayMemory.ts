import { RANKS } from './constants';
import {
  createCard,
  effectiveSuit,
  sameColorSuit,
  trickStrength,
} from './cards';
import type { Card, GameState, Suit, TrickPlay } from './types';
import { nextActivePlayer, playerTeam, trickSizeForState } from './teams';

function cardSeen(card: Card, seen: Card[]): boolean {
  return seen.some((c) => c.id === card.id);
}

/** Every card that counts as trump for this hand (7 cards in a 24-card deck). */
export function allEffectiveTrumpCards(trump: Suit): Card[] {
  const cards: Card[] = RANKS.map((value) => createCard(trump, value));
  const leftSuit = sameColorSuit(trump);
  if (leftSuit !== trump) {
    cards.push(createCard(leftSuit, 'J'));
  }
  return cards;
}

/** Completed tricks, dealer discards, and cards already played to the current trick. */
export function gatherPlayedCards(state: GameState): Card[] {
  return [...(state.cardsPlayed ?? []), ...state.currentTrick.map((p) => p.card)];
}

/**
 * True when every trump card stronger than `card` is already played or in this hand.
 * Does not infer opponent voids — only what is known from the table.
 */
export function isBossTrump(
  card: Card,
  trump: Suit,
  played: Card[],
  myHand: Card[]
): boolean {
  if (effectiveSuit(card, trump) !== trump) return false;
  const strength = trickStrength(card, trump, trump);
  for (const candidate of allEffectiveTrumpCards(trump)) {
    if (trickStrength(candidate, trump, trump) <= strength) continue;
    if (cardSeen(candidate, played)) continue;
    if (myHand.some((c) => c.id === candidate.id)) continue;
    return false;
  }
  return true;
}

/** Any trump not yet seen on the table or in the given hand. */
export function anyUnaccountedTrump(
  trump: Suit,
  played: Card[],
  myHand: Card[]
): boolean {
  for (const candidate of allEffectiveTrumpCards(trump)) {
    if (cardSeen(candidate, played)) continue;
    if (myHand.some((c) => c.id === candidate.id)) continue;
    return true;
  }
  return false;
}

/** Opponents who have not yet played this trick (after `playerId`). */
export function opponentsStillToAct(
  state: GameState,
  playerId: number,
  trick: TrickPlay[]
): number[] {
  const trickSize = trickSizeForState(state);
  const remaining = trickSize - trick.length - 1;
  if (remaining <= 0) return [];

  const opponents: number[] = [];
  let seat = playerId;
  for (let i = 0; i < remaining; i += 1) {
    seat = nextActivePlayer(seat, state);
    if (playerTeam(seat) !== playerTeam(playerId)) {
      opponents.push(seat);
    }
  }
  return opponents;
}

/**
 * Could a remaining opponent still beat this card?
 * Uses seen cards only — if higher trump is unaccounted for, assume they might have it.
 */
export function couldOpponentsStillBeat(
  card: Card,
  trump: Suit,
  leadSuit: Suit,
  played: Card[],
  myHand: Card[],
  opponentsStill: number[]
): boolean {
  if (opponentsStill.length === 0) return false;

  if (effectiveSuit(card, trump) === trump) {
    return !isBossTrump(card, trump, played, myHand);
  }

  if (effectiveSuit(card, trump) === leadSuit) {
    return anyUnaccountedTrump(trump, played, myHand);
  }

  return anyUnaccountedTrump(trump, played, myHand);
}

/** Prefer boss trump wins; otherwise slough when a later opponent might over-trump. */
export function filterSafeWinners(
  winners: Card[],
  trump: Suit,
  leadSuit: Suit,
  played: Card[],
  myHand: Card[],
  opponentsStill: number[]
): Card[] {
  if (winners.length === 0 || opponentsStill.length === 0) return winners;
  const safe = winners.filter(
    (c) => !couldOpponentsStillBeat(c, trump, leadSuit, played, myHand, opponentsStill)
  );
  return safe.length > 0 ? safe : [];
}
