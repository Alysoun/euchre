import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  gameReducer,
  initialGameState,
  PLAYER_COUNT,
  repairLoadedGameSession,
} from '@playfield/core/euchre';
import {
  clearGameSession,
  loadGameSession,
  saveGameSession,
} from '../sessionStorage';

describe('@playfield/core/euchre integration', () => {
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

  it('starts a four-player hand in bidding', () => {
    const state = gameReducer(initialGameState, {
      type: 'START_GAME',
      seats: [
        { isHuman: true, name: 'You' },
        { isHuman: false },
        { isHuman: false },
        { isHuman: false },
      ],
    });
    expect(state.phase).toBe('bidding');
    expect(state.players).toHaveLength(PLAYER_COUNT);
    expect(state.isSoloSession).toBe(true);
  });

  it('repairs duplicate log ids after reload like the app loader', () => {
    const dupes = {
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
      log: [
        { id: 'log-1', message: 'a', type: 'info' as const },
        { id: 'log-1', message: 'b', type: 'info' as const },
      ],
    };
    saveGameSession(dupes);
    const loaded = loadGameSession();
    expect(loaded).not.toBeNull();
    const ids = loaded!.log.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(repairLoadedGameSession(loaded!)).toEqual(loaded);
  });
});
