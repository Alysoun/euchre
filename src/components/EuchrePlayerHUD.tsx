import { useMemo, useRef } from 'react';
import styled, { css } from 'styled-components';
import Draggable, { DraggableData } from 'react-draggable';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';
import { useHudAnchorRef } from '../context/HudAnchorContext';
import { getLegalPlays } from '@playfield/core/euchre';
import { Card } from '../types/GameTypes';
import { displayPlayerName } from '../utils/playerName';
import { soundManager } from '../utils/SoundEffects';
import {
  hudDragBounds,
  Z_LAYOUT_EDIT_TARGET,
  Z_PLAYER_HUD,
  Z_SEAT_LABEL_DIMMED,
} from './hudPanelLayout';
import HandFan from './cards/HandFan';
import EuchreActionBar from './EuchreActionBar';

const dockFrame = css<{ $editMode?: boolean; $dimmed?: boolean }>`
  border-radius: 16px 16px 12px 12px;
  background: linear-gradient(
    180deg,
    rgba(18, 28, 22, 0.92) 0%,
    rgba(8, 12, 10, 0.96) 100%
  );
  color: white;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.55);
  opacity: ${(p) => (p.$dimmed ? 0.38 : 1)};
  pointer-events: ${(p) => (p.$dimmed ? 'none' : 'auto')};
  transition: opacity 0.15s ease;

  ${(p) =>
    p.$editMode
      ? `
    border: 2px dashed rgba(120, 200, 255, 0.65);
    outline: 1px solid rgba(255, 215, 0, 0.35);
    outline-offset: 2px;
    cursor: grab;
  `
      : `
    border: none;
    outline: none;
  `}
`;

const DockAnchor = styled.div<{ $dx: number; $dy: number; $z: number }>`
  position: fixed;
  left: calc(50% + ${(p) => p.$dx}px);
  bottom: calc(max(8px, env(safe-area-inset-bottom, 0px)) - ${(p) => p.$dy}px);
  transform: translateX(-50%);
  z-index: ${(p) => p.$z};
  width: min(720px, calc(100vw - 12px));
`;

const Dock = styled.div<{ $editMode?: boolean; $dimmed?: boolean }>`
  padding: 12px 14px 14px;
  overflow: visible;
  ${dockFrame}
`;

const Meta = styled.div`
  text-align: center;
  font-size: 0.84rem;
  opacity: 0.92;
  line-height: 1.45;
  margin-bottom: 6px;

  strong {
    color: #ffd700;
  }
`;

const FanBlock = styled.div<{ $scale: number }>`
  margin: 4px 0 8px;
  min-height: ${(p) => Math.round(138 * p.$scale)}px;
  padding-bottom: ${(p) => Math.round(10 * p.$scale)}px;
  transform: scale(${(p) => p.$scale});
  transform-origin: center bottom;
  overflow: visible;
`;

const ActionsBlock = styled.div`
  margin-top: 4px;
  padding-top: 4px;
`;

const TurnPulse = styled.span`
  display: inline-block;
  margin-left: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.55);
  color: #ffec8b;
  font-weight: 700;
  animation: pulse 1.4s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.65;
    }
  }
`;

const hudEditDragBounds = hudDragBounds(true);

const EuchrePlayerHUD: React.FC = () => {
  const { state, dispatch, canInteract, cardsConcealed } = useGame();
  const {
    layoutEditMode,
    isEditingLayoutGroup,
    hudDockOffset,
    setHudDockOffset,
    hudHandScale,
  } = useHudLayout();
  const hudEditMode = layoutEditMode && isEditingLayoutGroup('hud');
  const hudDimmed = layoutEditMode && !hudEditMode;
  const dockZ = hudEditMode
    ? Z_LAYOUT_EDIT_TARGET
    : hudDimmed
      ? Z_SEAT_LABEL_DIMMED
      : Z_PLAYER_HUD;
  const nodeRef = useRef<HTMLDivElement>(null);
  const hudAnchorRef = useHudAnchorRef('hud');

  const human = state.players.find((p) => p.isHuman);
  if (!human || state.players.length === 0) return null;

  const partner = state.players[(human.id + 2) % 4];
  const blockedByLayout = layoutEditMode;
  const isYourTurn =
    canInteract && !blockedByLayout && state.currentPlayer === human.id;

  const legalIds = useMemo(() => {
    if (state.phase !== 'playing' || !state.trump) return new Set<string>();
    const legal = getLegalPlays(human.cards, state.currentTrick, state.trump, state.leadSuit);
    return new Set(legal.map((c) => c.id));
  }, [human.cards, state.phase, state.trump, state.currentTrick, state.leadSuit]);

  const handPhases = ['bidding', 'biddingRound2', 'stickTheDealer', 'dealerDiscard', 'playing'] as const;
  const showFan =
    human.cards.length > 0 &&
    (handPhases as readonly string[]).includes(state.phase);

  const interactiveFan =
    state.phase === 'playing' ||
    (state.phase === 'dealerDiscard' && human.id === state.dealerId);

  const onPlay = (card: Card) => {
    void soundManager.unlock().then(() => {
      soundManager.play('cardPlay');
      if (state.phase === 'dealerDiscard') {
        dispatch({ type: 'DEALER_DISCARD', card });
      } else {
        dispatch({ type: 'PLAY_CARD', card });
      }
    });
  };

  const onReorder = (from: number, to: number) => {
    if (from === to) return;
    const cards = [...human.cards];
    const [moved] = cards.splice(from, 1);
    cards.splice(to, 0, moved);
    dispatch({ type: 'REORDER_CARDS', playerId: human.id, cards });
  };

  const fanLegalIds =
    state.phase === 'dealerDiscard'
      ? new Set(human.cards.map((c) => c.id))
      : legalIds;

  const onHudDrag = (_: unknown, data: DraggableData) => {
    setHudDockOffset({ dx: data.x, dy: data.y });
  };

  const dockBody = (
    <Dock $editMode={hudEditMode} $dimmed={hudDimmed} className={hudEditMode ? 'hud-drag-handle' : undefined}>
      <Meta>
        <strong>{displayPlayerName(human)}</strong> · With {partner.name}
        {isYourTurn && <TurnPulse>Your turn</TurnPulse>}
        {hudEditMode && ' · ⠿ drag to move'}
      </Meta>

        {cardsConcealed && showFan && (
          <Meta style={{ opacity: 0.75 }}>Dealing cards…</Meta>
        )}
        {showFan && !cardsConcealed && (
        <FanBlock $scale={hudHandScale}>
          <HandFan
            cards={human.cards}
            legalIds={fanLegalIds}
            onPlay={onPlay}
            onReorder={onReorder}
            disabled={!isYourTurn || !canInteract}
            dragDisabled={layoutEditMode}
            viewOnly={!interactiveFan}
          />
        </FanBlock>
      )}

      <ActionsBlock>
        <EuchreActionBar />
      </ActionsBlock>
    </Dock>
  );

  if (hudEditMode) {
    return (
      <DockAnchor $dx={0} $dy={0} $z={dockZ}>
        <Draggable
          nodeRef={nodeRef}
          handle=".hud-drag-handle"
          bounds={hudEditDragBounds}
          position={{ x: hudDockOffset.dx, y: hudDockOffset.dy }}
          onDrag={onHudDrag}
          onStop={onHudDrag}
        >
          <div
            ref={(el) => {
              (nodeRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              hudAnchorRef(el);
            }}
          >
            {dockBody}
          </div>
        </Draggable>
      </DockAnchor>
    );
  }

  return (
    <DockAnchor
      ref={hudAnchorRef}
      $dx={hudDockOffset.dx}
      $dy={hudDockOffset.dy}
      $z={dockZ}
    >
      {dockBody}
    </DockAnchor>
  );
};

export default EuchrePlayerHUD;
