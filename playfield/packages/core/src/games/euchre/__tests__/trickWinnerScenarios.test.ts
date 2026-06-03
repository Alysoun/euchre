import { describe, expect, it } from 'vitest';
import { createCard, effectiveSuit } from '../cards';
import { gameReducer, initialGameState } from '../reducer';
import { trickWinner } from '../trickPlay';

describe('trick winner scenarios from session logs', () => {
  const trump = 'hearts' as const;

  it('left bower lead beats trump 10 and trump K', () => {
    const trick = [
      { playerId: 3, card: createCard('diamonds', 'J') },
      { playerId: 1, card: createCard('hearts', 'K') },
      { playerId: 2, card: createCard('hearts', '10') },
    ];
    const leadSuit = effectiveSuit(trick[0].card, trump);
    expect(leadSuit).toBe('hearts');
    expect(trickWinner(trick, trump, leadSuit)).toBe(3);
  });

  it('off-suit ace on club lead does not beat king of clubs', () => {
    const trick = [
      { playerId: 1, card: createCard('clubs', 'K') },
      { playerId: 2, card: createCard('spades', 'A') },
      { playerId: 3, card: createCard('spades', 'Q') },
    ];
    expect(trickWinner(trick, trump, 'clubs')).toBe(1);
  });

  it('reducer awards left-bower lead in a lone hand', () => {
    let state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'Mike' },
        { isHuman: false, name: 'Emry' },
        { isHuman: false, name: 'Mylo' },
        { isHuman: false, name: 'Yailin' },
      ],
    });
    state = {
      ...state,
      phase: 'playing',
      trump,
      goAlone: true,
      lonerId: 2,
      makerTeam: 0,
      dealerId: 3,
      currentPlayer: 3,
      leadSuit: null,
      currentTrick: [],
      tricksWon: { 0: 0, 1: 0 },
      players: state.players.map((p, i) => {
        if (i === 3) return { ...p, cards: [createCard('diamonds', 'J')] };
        if (i === 1) return { ...p, cards: [createCard('hearts', 'K')] };
        if (i === 2) return { ...p, cards: [createCard('hearts', '10')] };
        return { ...p, cards: [] };
      }),
    };
    state = gameReducer(state, {
      type: 'PLAY_CARD',
      card: createCard('diamonds', 'J'),
    });
    expect(state.currentPlayer).toBe(1);
    state = gameReducer(state, {
      type: 'PLAY_CARD',
      card: createCard('hearts', 'K'),
    });
    expect(state.currentPlayer).toBe(2);
    state = gameReducer(state, {
      type: 'PLAY_CARD',
      card: createCard('hearts', '10'),
    });
    expect(state.tricksWon[1]).toBe(1);
    const winLine = [...state.log].reverse().find((e) => e.message.includes('wins the trick'));
    expect(winLine?.message).toContain('Yailin');
    expect(winLine?.message).toContain('left bower');
  });

  it('reducer awards club lead over off-suit discards', () => {
    let state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'Mike' },
        { isHuman: false, name: 'Emry' },
        { isHuman: false, name: 'Mylo' },
        { isHuman: false, name: 'Yailin' },
      ],
    });
    state = {
      ...state,
      phase: 'playing',
      trump,
      goAlone: true,
      lonerId: 2,
      makerTeam: 0,
      dealerId: 3,
      currentPlayer: 1,
      leadSuit: null,
      currentTrick: [],
      tricksWon: { 0: 0, 1: 0 },
      players: state.players.map((p, i) => {
        if (i === 1) return { ...p, cards: [createCard('clubs', 'K')] };
        if (i === 2) return { ...p, cards: [createCard('spades', 'A')] };
        if (i === 3) return { ...p, cards: [createCard('spades', 'Q')] };
        return { ...p, cards: [] };
      }),
    };
    state = gameReducer(state, { type: 'PLAY_CARD', card: createCard('clubs', 'K') });
    state = gameReducer(state, { type: 'PLAY_CARD', card: createCard('spades', 'A') });
    state = gameReducer(state, { type: 'PLAY_CARD', card: createCard('spades', 'Q') });
    expect(state.tricksWon[1]).toBe(1);
    const winLine = [...state.log].reverse().find((e) => e.message.includes('wins the trick'));
    expect(winLine?.message).toContain('Emry');
  });
});
