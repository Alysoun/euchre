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
import {
  biddingHandKey,
  dealAnimationDurationMs,
  type GamePace,
  loadStoredGamePace,
  paceTimings,
  saveStoredGamePace,
} from '../game/gamePace';
import {
  completedTrickFromAction,
  revealDurationMs,
} from '../game/trickReveal';

function initGameState(): GameState {
  return loadGameSession() ?? initialGameState;
}

export type GamePause =
  | { kind: 'none' }
  | { kind: 'trickReveal'; trick: TrickPlay[] }
  | { kind: 'trickCollect'; trick: TrickPlay[]; winnerId: number }
  | { kind: 'dealing'; handKey: string }
  | { kind: 'turnedReveal'; handKey: string }
  | { kind: 'actionBeat' };

const GameContext = createContext<
  | {
      state: GameState;
      dispatch: React.Dispatch<GameAction>;
      dispatchAI: () => void;
      gamePace: GamePace;
      setGamePace: (pace: GamePace) => void;
      pause: GamePause;
      completeAnimationPause: () => void;
      visibleTrick: TrickPlay[];
      lastRevealPlay: TrickPlay | null;
      actionPaused: boolean;
      cardsConcealed: boolean;
      canInteract: boolean;
    }
  | undefined
>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, initGameState);
  const [gamePace, setGamePaceState] = useState<GamePace>(() => loadStoredGamePace());
  const [pause, setPause] = useState<GamePause>({ kind: 'none' });
  const stateRef = useRef(state);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDealKeyRef = useRef<string | null>(null);
  const lastTurnedKeyRef = useRef<string | null>(null);

  const clearPauseTimer = useCallback(() => {
    if (pauseTimer.current) {
      clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
    }
  }, []);

  const setGamePace = useCallback((pace: GamePace) => {
    setGamePaceState(pace);
    saveStoredGamePace(pace);
  }, []);

  const schedulePauseEnd = useCallback(
    (ms: number, next: GamePause = { kind: 'none' }) => {
      clearPauseTimer();
      if (ms <= 0) {
        setPause(next);
        return;
      }
      pauseTimer.current = setTimeout(() => {
        setPause(next);
        pauseTimer.current = null;
      }, ms);
    },
    [clearPauseTimer]
  );

  const beginActionBeat = useCallback(
    (ms: number) => {
      if (ms <= 0) return;
      setPause({ kind: 'actionBeat' });
      schedulePauseEnd(ms);
    },
    [schedulePauseEnd]
  );

  const beginTrickCollect = useCallback(
    (trick: TrickPlay[], winnerId: number, pace: GamePace) => {
      const ms = paceTimings(pace).trickCollectMs;
      if (ms <= 0) {
        setPause({ kind: 'none' });
        return;
      }
      setPause({ kind: 'trickCollect', trick, winnerId });
      pauseTimer.current = setTimeout(() => {
        setPause({ kind: 'none' });
        pauseTimer.current = null;
      }, ms + 300);
    },
    []
  );

  const beginTrickReveal = useCallback(
    (trick: TrickPlay[], winnerId: number, pace: GamePace) => {
      clearPauseTimer();
      setPause({ kind: 'trickReveal', trick });
      const ms = revealDurationMs(trick, paceTimings(pace).trickRevealMs);
      pauseTimer.current = setTimeout(() => {
        pauseTimer.current = null;
        beginTrickCollect(trick, winnerId, pace);
      }, ms);
    },
    [beginTrickCollect, clearPauseTimer]
  );

  const completeAnimationPause = useCallback(() => {
    clearPauseTimer();
    setPause((current) => {
      if (current.kind === 'dealing') {
        const key = biddingHandKey(stateRef.current);
        lastTurnedKeyRef.current = key;
        const ms = paceTimings(gamePace).turnedCardRevealMs;
        if (ms > 0) {
          pauseTimer.current = setTimeout(() => {
            setPause({ kind: 'none' });
            pauseTimer.current = null;
          }, ms);
          return { kind: 'turnedReveal', handKey: key };
        }
      }
      return { kind: 'none' };
    });
  }, [clearPauseTimer, gamePace]);

  useEffect(() => () => clearPauseTimer(), [clearPauseTimer]);

  const dispatch = useCallback(
    (action: GameAction) => {
      const prev = stateRef.current;
      const next = gameReducer(prev, action);
      const pace = gamePace;
      const timings = paceTimings(pace);

      if (action.type === 'PLAY_CARD' && prev.phase === 'playing') {
        const completed = completedTrickFromAction(prev, action, next);
        if (completed) {
          beginTrickReveal(completed.trick, completed.winnerId, pace);
        } else if (timings.cardPlayBeatMs > 0) {
          beginActionBeat(timings.cardPlayBeatMs);
        }
      } else if (
        (action.type === 'BID' || action.type === 'DEALER_DISCARD') &&
        timings.bidBeatMs > 0
      ) {
        beginActionBeat(timings.bidBeatMs);
      }

      if (debugLogActions()) {
        console.debug('[euchre dispatch]', action);
      }
      rawDispatch(action);
    },
    [beginActionBeat, beginTrickReveal, gamePace]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.phase !== 'playing') {
      if (pause.kind === 'trickReveal' || pause.kind === 'trickCollect') {
        clearPauseTimer();
        setPause({ kind: 'none' });
      }
    }
    if (
      state.players.length === 0 ||
      state.phase === 'setup' ||
      state.phase === 'gameOver'
    ) {
      clearGameSession();
      lastDealKeyRef.current = null;
      lastTurnedKeyRef.current = null;
      return;
    }
    saveGameSession(state);
  }, [state, clearPauseTimer, pause.kind]);

  /** Safety net if animation/timer callbacks are interrupted. */
  useEffect(() => {
    if (pause.kind === 'none') return;
    if (
      pause.kind !== 'dealing' &&
      pause.kind !== 'turnedReveal' &&
      pause.kind !== 'actionBeat'
    ) {
      return;
    }
    const ms =
      pause.kind === 'dealing'
        ? dealAnimationDurationMs(gamePace) + paceTimings(gamePace).turnedCardRevealMs + 800
        : pause.kind === 'turnedReveal'
          ? paceTimings(gamePace).turnedCardRevealMs + 600
          : paceTimings(gamePace).bidBeatMs + 400;
    const safety = window.setTimeout(() => {
      clearPauseTimer();
      setPause({ kind: 'none' });
    }, ms);
    return () => window.clearTimeout(safety);
  }, [pause.kind, gamePace, clearPauseTimer]);

  useEffect(() => {
    if (state.phase !== 'bidding' || !state.turnedCard) return;
    const key = biddingHandKey(state);
    if (lastDealKeyRef.current === key) return;
    lastDealKeyRef.current = key;
    lastTurnedKeyRef.current = null;

    if (gamePace === 'instant') return;

    clearPauseTimer();
    setPause({ kind: 'dealing', handKey: key });
  }, [state.phase, state.roundNumber, state.dealerId, state.turnedCard, gamePace, clearPauseTimer]);

  const dispatchAI = useCallback(() => {
    const raw = getAIAction(stateRef.current);
    if (!raw) return;
    dispatch(aiActionToGameAction(raw));
  }, [dispatch]);

  const frozenTrick =
    pause.kind === 'trickReveal' || pause.kind === 'trickCollect' ? pause.trick : null;

  const visibleTrick = useMemo(() => {
    if (frozenTrick && frozenTrick.length > 0) return frozenTrick;
    return state.currentTrick;
  }, [frozenTrick, state.currentTrick]);

  const lastRevealPlay = useMemo(() => {
    if (!frozenTrick || frozenTrick.length === 0) return null;
    return frozenTrick[frozenTrick.length - 1] ?? null;
  }, [frozenTrick]);

  const canInteract = pause.kind === 'none';
  const cardsConcealed = pause.kind === 'dealing';
  const actionPaused = pause.kind !== 'none';

  const value = useMemo(
    () => ({
      state,
      dispatch,
      dispatchAI,
      gamePace,
      setGamePace,
      pause,
      completeAnimationPause,
      visibleTrick,
      lastRevealPlay,
      actionPaused,
      cardsConcealed,
      canInteract,
    }),
    [
      state,
      dispatch,
      dispatchAI,
      gamePace,
      setGamePace,
      pause,
      completeAnimationPause,
      visibleTrick,
      lastRevealPlay,
      actionPaused,
      cardsConcealed,
      canInteract,
    ]
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
