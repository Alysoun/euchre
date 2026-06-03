import React, { useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';
import { EuchreAIDifficulty, SeatConfig } from '../types/GameTypes';
import PlayerSelect from './PlayerSelect';
import EuchreScoreboard from './EuchreScoreboard';
import EuchrePlayerHUD from './EuchrePlayerHUD';
import TrickCenter from './TrickCenter';
import HandSummaryModal from './HandSummaryModal';
import GameLog from './GameLog';
import LeaveTableButton from './LeaveTableButton';
import EuchreTableControls from './EuchreTableControls';
import LayoutEditOverlay from './LayoutEditOverlay';
import AnimationLayer from './AnimationLayer';
import TrumpSuitPill from './TrumpSuitPill';
import SeatLabels from './SeatLabels';
import SeatAnchors from './SeatAnchors';
import { useAITurn } from '../hooks/useAITurn';
import { useGameSounds } from '../hooks/useGameSounds';
import { EUCHRE_PLAY_DRAG } from '../game/cardDrag';
import type { GamePace } from '../game/gamePace';
import { soundManager } from '../utils/SoundEffects';
import { validatePlay } from '@playfield/core/euchre';
import { GlobalStyle } from '../styles/GlobalStyle';
import {
  SetupOverlay,
  TableContainer,
  TableFelt,
  TableRail,
  TableSceneWrap,
  TableShadow,
  TableStack,
  TableSurface,
} from './table/TableScene';

const GameTable: React.FC = () => {
  const { state, dispatch, canInteract, setGamePace } = useGame();
  useAITurn();
  useGameSounds();
  const [playDropActive, setPlayDropActive] = useState(false);

  const isGameStarted = state.players.length > 0;

  const handleStart = useCallback(
    (seats: SeatConfig[], aiDifficulty: EuchreAIDifficulty, pace: GamePace) => {
      setGamePace(pace);
      dispatch({ type: 'START_GAME', seats, aiDifficulty });
    },
    [dispatch, setGamePace]
  );

  const handleTableDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(EUCHRE_PLAY_DRAG)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setPlayDropActive(true);
  }, []);

  const handleTableDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setPlayDropActive(false);
  }, []);

  const handleTableDrop = useCallback(
    (e: React.DragEvent) => {
      setPlayDropActive(false);
      const cardId = e.dataTransfer.getData(EUCHRE_PLAY_DRAG);
      if (!cardId || !canInteract) return;
      e.preventDefault();

      const human = state.players.find((p) => p.isHuman);
      if (!human) return;

      const card = human.cards.find((c) => c.id === cardId);
      if (!card) return;

      if (state.phase === 'dealerDiscard') {
        if (human.id !== state.dealerId) return;
        void soundManager.unlock().then(() => {
          soundManager.play('cardPlay');
          dispatch({ type: 'DEALER_DISCARD', card });
        });
        return;
      }

      if (state.phase !== 'playing' || !state.trump) return;
      if (state.currentPlayer !== human.id) return;
      if (
        !validatePlay(
          human.cards,
          card,
          state.currentTrick,
          state.trump,
          state.leadSuit
        )
      ) {
        return;
      }

      void soundManager.unlock().then(() => {
        soundManager.play('cardPlay');
        dispatch({ type: 'PLAY_CARD', card });
      });
    },
    [canInteract, dispatch, state]
  );

  return (
    <TableContainer>
      <GlobalStyle />
      <EuchreScoreboard />
      <GameLog />
      <TrumpSuitPill />
      <EuchreTableControls />
      <LayoutEditOverlay />
      <LeaveTableButton />
      <HandSummaryModal />
      <AnimationLayer />

      <TableSceneWrap>
        <TableShadow aria-hidden />
        <TableStack>
          <TableSurface>
            <TableRail aria-hidden />
            <TableFelt
              $playDropActive={playDropActive}
              onDragOver={handleTableDragOver}
              onDragLeave={handleTableDragLeave}
              onDrop={handleTableDrop}
            >
              {isGameStarted && <SeatAnchors totalPlayers={state.players.length} />}
              <TrickCenter />
            </TableFelt>
          </TableSurface>
        </TableStack>
      </TableSceneWrap>

      {isGameStarted && (
        <SeatLabels
          players={state.players}
          dealerId={state.dealerId}
          currentPlayer={state.currentPlayer}
          trumpCallerId={state.trumpCallerId}
          trumpCallKind={state.trumpCallKind}
          goAlone={state.goAlone}
        />
      )}

      {isGameStarted && <EuchrePlayerHUD />}

      {!isGameStarted && (
        <SetupOverlay>
          <PlayerSelect onStart={handleStart} />
        </SetupOverlay>
      )}
    </TableContainer>
  );
};

export default GameTable;
