import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialGameState, PLAYER_COUNT } from '@playfield/core/euchre';
import { clearGameSession, loadGameSession, saveGameSession } from '../sessionStorage';

describe('game session persistence', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    clearGameSession();
  });

  it('round-trips an in-progress game', () => {
    const midGame = {
      ...initialGameState,
      players: Array.from({ length: PLAYER_COUNT }, (_, id) => ({
        id,
        name: `P${id}`,
        isHuman: id === 0,
        cards: [],
        team: (id % 2) as 0 | 1,
      })),
      phase: 'playing' as const,
      trump: 'hearts' as const,
      roundNumber: 2,
    };
    saveGameSession(midGame);
    const loaded = loadGameSession();
    expect(loaded?.phase).toBe('playing');
    expect(loaded?.roundNumber).toBe(2);
    expect(loaded?.players).toHaveLength(PLAYER_COUNT);
  });

  it('ignores non-Euchre persisted shapes (e.g. old Tripoley saves)', () => {
    store.set(
      'euchre-active-session',
      JSON.stringify({
        players: [{ id: 0, name: 'You', isHuman: true, chips: 100, cards: [] }],
        phase: 'poker',
      })
    );
    expect(loadGameSession()).toBeNull();
  });

  it('does not save or restore game over', () => {
    saveGameSession({
      ...initialGameState,
      players: [
        {
          id: 0,
          name: 'You',
          isHuman: true,
          cards: [],
          team: 0,
        },
      ],
      phase: 'gameOver',
    });
    expect(store.has('euchre-active-session')).toBe(false);
    expect(loadGameSession()).toBeNull();
  });
});
