import { describe, expect, it } from 'vitest';
import {
  gameReducer,
  initialGameState,
  getAIAction,
  aiActionToGameAction,
  PLAYER_COUNT,
} from '../index';
import { createCard, createEuchreDeck } from '../cards';
import { resetLogCounter } from '../gameLog';

const AI_SEATS = Array.from({ length: PLAYER_COUNT }, () => ({ isHuman: false }));

function startAllAi() {
  resetLogCounter();
  return gameReducer(initialGameState, { type: 'START_GAME', seats: AI_SEATS });
}

describe('euchre reducer', () => {
  it('starts a hand in bidding with four players dealt five cards', () => {
    const state = startAllAi();
    expect(state.players).toHaveLength(PLAYER_COUNT);
    expect(state.phase).toBe('bidding');
    expect(state.turnedCard).not.toBeNull();
    state.players.forEach((p) => expect(p.cards).toHaveLength(5));
    const deckSize = createEuchreDeck().length;
    expect(deckSize).toBe(24);
  });

  it('rejects wrong seat count', () => {
    const state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [{ isHuman: true }, { isHuman: false }],
    });
    expect(state.phase).toBe('setup');
  });

  it('assigns unique log ids across a new game', () => {
    const state = startAllAi();
    const ids = state.log.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('advances AI bidding without stuck phase', () => {
    let state = startAllAi();
    for (let i = 0; i < 24 && state.phase === 'bidding'; i += 1) {
      const ai = getAIAction(state);
      if (!ai) break;
      state = gameReducer(state, aiActionToGameAction(ai));
    }
    expect(['biddingRound2', 'dealerDiscard', 'playing', 'handSummary', 'gameOver']).toContain(
      state.phase
    );
  });

  it('solo human seat flags isSoloSession', () => {
    const state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'You' },
        { isHuman: false },
        { isHuman: false },
        { isHuman: false },
      ],
    });
    expect(state.isSoloSession).toBe(true);
    expect(state.players[0].isHuman).toBe(true);
  });

  it('reorders human hand without changing card set', () => {
    const state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'You' },
        { isHuman: false },
        { isHuman: false },
        { isHuman: false },
      ],
    });
    const hand = state.players[0].cards;
    const reversed = [...hand].reverse();
    const next = gameReducer(state, {
      type: 'REORDER_CARDS',
      playerId: 0,
      cards: reversed,
    });
    expect(next.players[0].cards.map((c) => c.id)).toEqual(reversed.map((c) => c.id));
    expect(next.players[1].cards).toEqual(state.players[1].cards);
  });

  it('ignores reorder from AI seat', () => {
    const state = startAllAi();
    const hand = state.players[1].cards;
    const reversed = [...hand].reverse();
    const next = gameReducer(state, {
      type: 'REORDER_CARDS',
      playerId: 1,
      cards: reversed,
    });
    expect(next).toBe(state);
  });

  it('completes a three-card trick when going alone', () => {
    let state = startAllAi();
    state = {
      ...state,
      phase: 'playing',
      trump: 'hearts',
      goAlone: true,
      lonerId: 0,
      makerTeam: 0,
      trumpCallerId: 0,
      trumpCallKind: 'orderUp',
      currentPlayer: 2,
      leadSuit: 'clubs',
      currentTrick: [
        { playerId: 0, card: createCard('clubs', '9') },
        { playerId: 2, card: createCard('clubs', 'K') },
      ],
      players: state.players.map((p, i) =>
        i === 2 ? { ...p, cards: [createCard('clubs', 'A')] } : { ...p, cards: [] }
      ),
    };
    state = gameReducer(state, {
      type: 'PLAY_CARD',
      card: createCard('clubs', 'A'),
    });
    expect(state.currentTrick).toHaveLength(0);
    expect(state.tricksWon[0]).toBe(1);
  });

  it('rejects illegal card play', () => {
    let state = startAllAi();
    state = {
      ...state,
      phase: 'playing',
      trump: 'hearts',
      currentPlayer: 0,
      leadSuit: 'spades',
      currentTrick: [{ playerId: 1, card: createCard('spades', 'A') }],
      players: state.players.map((p, i) =>
        i === 0
          ? { ...p, cards: [createCard('spades', '9'), createCard('diamonds', '10')] }
          : p
      ),
    };
    const illegal = gameReducer(state, {
      type: 'PLAY_CARD',
      card: createCard('diamonds', '10'),
    });
    expect(illegal.currentTrick).toHaveLength(1);
  });
});
