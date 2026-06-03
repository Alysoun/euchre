import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { GameState, GameAction, TrickPlay } from '../types/GameTypes';
import {
  gameReducer,
  initialGameState,
  aiActionToGameAction,
  getAIAction,
} from '@playfield/core/euchre';
import { clearGameSession, loadGameSession, saveGameSession } from '../game/sessionStorage';
import { debugLogActions } from '../debugConfig';
import { revealDurationMs, trickPlaysAfterAction } from '../game/trickReveal';

function initGameState(): GameState {
  return loadGameSession() ?? initialGameState;
}

type TrickRevealState = {
  active: boolean;
  trick: TrickPlay[];
  lastPlay: TrickPlay | null;
};

const GameContext = createContext<
  | {
      state: GameState;
      dispatch: React.Dispatch<GameAction>;
      dispatchAI: () => void;
      /** Trick cards to render (includes frozen trick during pause). */
      visibleTrick: TrickPlay[];
      lastRevealPlay: TrickPlay | null;
      /** True while pausing so players can see the last card played. */
      actionPaused: boolean;
      canInteract: boolean;
    }
  | undefined
>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, initGameState);
  const stateRef = useRef(state);
  const [reveal, setReveal] = useState<TrickRevealState>({
    active: false,
    trick: [],
    lastPlay: null,
  });
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRevealTimer = useCallback(() => {
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
  }, []);

  const beginReveal = useCallback(
    (trick: TrickPlay[]) => {
      clearRevealTimer();
      const lastPlay = trick[trick.length - 1] ?? null;
      setReveal({ active: true, trick, lastPlay });
      revealTimer.current = setTimeout(() => {
        setReveal({ active: false, trick: [], lastPlay: null });
        revealTimer.current = null;
      }, revealDurationMs(trick));
    },
    [clearRevealTimer]
  );

  useEffect(() => () => clearRevealTimer(), [clearRevealTimer]);

  const dispatch = useCallback(
    (action: GameAction) => {
      const prev = stateRef.current;
      const next = gameReducer(prev, action);
      const shown = trickPlaysAfterAction(prev, action, next);
      if (shown) beginReveal(shown);
      if (debugLogActions()) {
        console.debug('[euchre dispatch]', action);
      }
      rawDispatch(action);
    },
    [beginReveal]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.phase !== 'playing') {
      clearRevealTimer();
      setReveal({ active: false, trick: [], lastPlay: null });
    }
    if (
      state.players.length === 0 ||
      state.phase === 'setup' ||
      state.phase === 'gameOver'
    ) {
      clearGameSession();
      return;
    }
    saveGameSession(state);
  }, [state, clearRevealTimer]);

  const dispatchAI = useCallback(() => {
    const raw = getAIAction(stateRef.current);
    if (!raw) return;
    dispatch(aiActionToGameAction(raw));
  }, [dispatch]);

  const visibleTrick = useMemo(() => {
    if (reveal.active && reveal.trick.length > 0) return reveal.trick;
    return state.currentTrick;
  }, [reveal.active, reveal.trick, state.currentTrick]);

  const canInteract = !reveal.active;

  const value = useMemo(
    () => ({
      state,
      dispatch,
      dispatchAI,
      visibleTrick,
      lastRevealPlay: reveal.lastPlay,
      actionPaused: reveal.active,
      canInteract,
    }),
    [state, dispatch, dispatchAI, visibleTrick, reveal.lastPlay, reveal.active, canInteract]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
