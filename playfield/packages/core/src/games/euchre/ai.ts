import type { GameState, Suit } from './types';
import type { EuchreAIDifficulty } from './aiDifficulty';
import { DEFAULT_EUCHRE_AI_DIFFICULTY } from './aiDifficulty';
import {
  applyDifficultyToNameTrump,
  applyDifficultyToOrderUp,
  applyDifficultyToPlay,
  pickDiscard,
  pickExpertPlay,
  shouldGoAlone,
  shouldGoAloneOnOrderUp,
  shouldNameTrump,
  shouldOrderUp,
} from './aiStrategy';

export type AIAction =
  | {
      type: 'BID';
      action: 'pass' | 'orderUp' | 'nameTrump';
      suit?: Suit;
      goAlone?: boolean;
    }
  | { type: 'DEALER_DISCARD'; card: GameState['players'][0]['cards'][0] }
  | { type: 'PLAY_CARD'; card: GameState['players'][0]['cards'][0] }
  | null;

function tableDifficulty(state: GameState): EuchreAIDifficulty {
  return state.aiDifficulty ?? DEFAULT_EUCHRE_AI_DIFFICULTY;
}

export function getAIAction(state: GameState): AIAction {
  const player = state.players[state.currentPlayer];
  if (!player || player.isHuman) return null;

  const difficulty = tableDifficulty(state);

  if (state.phase === 'bidding' && state.turnedCard) {
    const turned = state.turnedCard.suit;
    let order = shouldOrderUp(player.cards, turned, difficulty);
    order = applyDifficultyToOrderUp(order, player.cards, turned, difficulty);
    if (!order) {
      return { type: 'BID', action: 'pass' };
    }
    const alone = shouldGoAloneOnOrderUp(
      player.cards,
      state.turnedCard,
      turned,
      player.id === state.dealerId,
      difficulty
    );
    return {
      type: 'BID',
      action: 'orderUp',
      goAlone: alone || undefined,
    };
  }

  if (state.phase === 'biddingRound2') {
    const pick = applyDifficultyToNameTrump(
      shouldNameTrump(player.cards, state.turnedCard?.suit ?? null, difficulty),
      player.cards,
      state.turnedCard?.suit ?? null,
      difficulty
    );
    if (!pick) {
      return { type: 'BID', action: 'pass' };
    }
    const alone = shouldGoAlone(player.cards, pick.suit, difficulty);
    return {
      type: 'BID',
      action: 'nameTrump',
      suit: pick.suit,
      goAlone: alone || undefined,
    };
  }

  if (state.phase === 'dealerDiscard' && player.id === state.dealerId && state.trump) {
    return { type: 'DEALER_DISCARD', card: pickDiscard(player.cards, state.trump) };
  }

  if (state.phase === 'playing' && state.trump) {
    const expert = pickExpertPlay(state, player.id);
    const card = applyDifficultyToPlay(expert, state, player.id, difficulty);
    return { type: 'PLAY_CARD', card };
  }

  return null;
}

export function aiActionToGameAction(raw: NonNullable<AIAction>) {
  switch (raw.type) {
    case 'BID':
      return {
        type: 'BID' as const,
        action: raw.action,
        suit: raw.suit,
        goAlone: raw.goAlone,
      };
    case 'DEALER_DISCARD':
      return { type: 'DEALER_DISCARD' as const, card: raw.card };
    case 'PLAY_CARD':
      return { type: 'PLAY_CARD' as const, card: raw.card };
  }
}
