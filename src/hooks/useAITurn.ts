import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';
import { debugAiTurnDelayMs } from '../debugConfig';

export function useAITurn() {
  const { state, dispatchAI, canInteract } = useGame();
  const { layoutEditMode } = useHudLayout();

  useEffect(() => {
    if (!canInteract || layoutEditMode) return;

    const current = state.players[state.currentPlayer];
    if (!current || current.isHuman) return;
    if (
      state.phase === 'setup' ||
      state.phase === 'gameOver' ||
      state.phase === 'handSummary'
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatchAI();
    }, debugAiTurnDelayMs(0));

    return () => window.clearTimeout(timer);
  }, [
    canInteract,
    layoutEditMode,
    state.phase,
    state.currentPlayer,
    state.players,
    state.passesThisRound,
    state.currentTrick,
    dispatchAI,
  ]);
}
