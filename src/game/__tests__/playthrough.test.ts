import { describe, expect, it } from 'vitest';
import {
  gameReducer,
  initialGameState,
  getAIAction,
  aiActionToGameAction,
  getLegalPlays,
  PLAYER_COUNT,
} from '@playfield/core/euchre';

const AI_SEATS = Array.from({ length: PLAYER_COUNT }, () => ({ isHuman: false }));

function runAllAi(maxSteps = 500): ReturnType<typeof gameReducer> {
  let state = gameReducer(initialGameState, { type: 'START_GAME', seats: AI_SEATS });
  for (let i = 0; i < maxSteps; i += 1) {
    if (state.phase === 'gameOver') break;
    if (state.phase === 'handSummary') {
      state = gameReducer(state, { type: 'DISMISS_HAND_SUMMARY' });
      continue;
    }
    const ai = getAIAction(state);
    if (!ai) break;
    state = gameReducer(state, aiActionToGameAction(ai));
  }
  return state;
}

describe('solo playthrough', () => {
  it('all-AI game reaches game over within step budget', () => {
    const end = runAllAi(800);
    expect(end.phase).toBe('gameOver');
    expect(end.score[0] >= 10 || end.score[1] >= 10).toBe(true);
  });

  it('human solo seat can start and accept AI bids', () => {
    let state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'You' },
        { isHuman: false },
        { isHuman: false },
        { isHuman: false },
      ],
    });
    expect(state.phase).toBe('bidding');
    for (let i = 0; i < 40 && state.phase === 'bidding'; i += 1) {
      if (state.currentPlayer === 0) {
        state = gameReducer(state, { type: 'BID', action: 'pass' });
      } else {
        const ai = getAIAction(state);
        if (!ai) break;
        state = gameReducer(state, aiActionToGameAction(ai));
      }
    }
    expect(['biddingRound2', 'dealerDiscard', 'playing', 'handSummary']).toContain(
      state.phase
    );
  });

  it('human can play a full solo session to game over', () => {
    let state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'You' },
        { isHuman: false },
        { isHuman: false },
        { isHuman: false },
      ],
    });

    for (let step = 0; step < 1200 && state.phase !== 'gameOver'; step += 1) {
      if (state.phase === 'handSummary') {
        state = gameReducer(state, { type: 'DISMISS_HAND_SUMMARY' });
        continue;
      }

      const you = state.players[state.currentPlayer];
      if (!you) break;

      if (you.isHuman) {
        if (state.phase === 'bidding') {
          state = gameReducer(state, { type: 'BID', action: 'pass' });
        } else if (state.phase === 'biddingRound2') {
          state = gameReducer(state, { type: 'BID', action: 'pass' });
        } else if (state.phase === 'dealerDiscard' && you.id === state.dealerId) {
          state = gameReducer(state, {
            type: 'DEALER_DISCARD',
            card: you.cards[0],
          });
        } else if (state.phase === 'playing' && state.trump) {
          const legal = getLegalPlays(
            you.cards,
            state.currentTrick,
            state.trump,
            state.leadSuit
          );
          const card = legal[0] ?? you.cards[0];
          state = gameReducer(state, { type: 'PLAY_CARD', card });
        }
      } else {
        const ai = getAIAction(state);
        if (!ai) break;
        state = gameReducer(state, aiActionToGameAction(ai));
      }
    }

    expect(state.phase).toBe('gameOver');
  });
});
