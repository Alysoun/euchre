import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Draggable, { DraggableData } from 'react-draggable';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';
import { useHudAnchors } from '../context/HudAnchorContext';
import { SUIT_SYMBOL } from '@playfield/core/euchre';
import type { GameState, Suit } from '../types/GameTypes';
import { trumpCallerShortLabel } from '../utils/trumpCallerLabel';
import {
  clampTrumpPillCenter,
  nearestSnap,
  resolveTrumpPillCenter,
  snapPointsFromRects,
  TRUMP_PILL_BASE_PX,
} from './trumpPillLayout';
import {
  Z_LAYOUT_EDIT_TARGET,
  Z_SEAT_LABEL_DIMMED,
} from './hudPanelLayout';

const Z_TRUMP_PILL = 128;

const suitInk: Record<Suit, string> = {
  hearts: '#e53935',
  diamonds: '#e53935',
  clubs: '#1a1a1a',
  spades: '#1a1a1a',
};

/** Draggable uses top-left; layout stores pill center. */
function dragOffsetForScale(scale: number): { x: number; y: number } {
  const body = TRUMP_PILL_BASE_PX * scale;
  return { x: body / 2, y: body / 2 + 14 };
}

function centerToDrag(pos: { x: number; y: number }, scale: number) {
  const o = dragOffsetForScale(scale);
  return { x: pos.x - o.x, y: pos.y - o.y };
}

function dragToCenter(pos: { x: number; y: number }, scale: number) {
  const o = dragOffsetForScale(scale);
  return { x: pos.x + o.x, y: pos.y + o.y };
}

const PillWrap = styled.div<{ $editMode?: boolean; $dimmed?: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  z-index: ${(p) =>
    p.$editMode ? Z_LAYOUT_EDIT_TARGET : p.$dimmed ? Z_SEAT_LABEL_DIMMED : Z_TRUMP_PILL};
  opacity: ${(p) => (p.$dimmed ? 0.55 : 1)};
  pointer-events: auto;
  transition: opacity 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  ${(p) =>
    p.$editMode
      ? `
    outline: 1px dashed rgba(120, 200, 255, 0.65);
    outline-offset: 4px;
    border-radius: 12px;
  `
      : ''}
`;

const PillBody = styled.div<{ $scale: number; $suit: Suit; $dragSurface?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => TRUMP_PILL_BASE_PX * p.$scale}px;
  height: ${(p) => TRUMP_PILL_BASE_PX * p.$scale}px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(235, 235, 240, 0.98) 100%);
  border: 2px solid rgba(255, 215, 0, 0.65);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: ${(p) => suitInk[p.$suit]};
  font-size: ${(p) => Math.round(TRUMP_PILL_BASE_PX * p.$scale * 0.52)}px;
  line-height: 1;
  font-weight: 700;
  user-select: none;
  cursor: ${(p) => (p.$dragSurface ? 'grab' : 'default')};
  touch-action: none;

  &:active {
    cursor: ${(p) => (p.$dragSurface ? 'grabbing' : 'default')};
  }
`;

const Grip = styled.button`
  position: absolute;
  top: -6px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 215, 0, 0.5);
  background: rgba(0, 0, 0, 0.82);
  color: #ffd700;
  font-size: 0.62rem;
  line-height: 1;
  padding: 0;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  &:active {
    cursor: grabbing;
  }
`;

const Caption = styled.span<{ $scale: number }>`
  font-size: ${(p) => Math.max(9, Math.round(10 * p.$scale))}px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffd700;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
`;

const Sub = styled.span<{ $scale: number }>`
  font-size: ${(p) => Math.max(8, Math.round(9 * p.$scale))}px;
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
  pointer-events: none;
`;

function displaySuit(
  state: Pick<GameState, 'trump' | 'turnedCard' | 'phase' | 'trumpCallerId' | 'trumpCallKind' | 'goAlone' | 'players'>
): { suit: Suit; label: string; sub?: string } | null {
  if (state.trump) {
    const caller = trumpCallerShortLabel(state);
    return { suit: state.trump, label: 'Trump', sub: caller ?? undefined };
  }
  if (
    state.turnedCard &&
    (state.phase === 'bidding' || state.phase === 'biddingRound2')
  ) {
    return { suit: state.turnedCard.suit, label: 'Turned', sub: 'to order' };
  }
  return null;
}

const TrumpSuitPill: React.FC = () => {
  const { state } = useGame();
  const {
    layoutEditMode,
    isEditingLayoutGroup,
    trumpPillLayout,
    setTrumpPillLayout,
    gameLogLayout,
    hudDockOffset,
  } = useHudLayout();
  const { getAnchorRects } = useHudAnchors();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);
  const trumpEdit = layoutEditMode && isEditingLayoutGroup('trump');
  const dimmed = layoutEditMode && !trumpEdit;
  const dragHandle = trumpEdit ? '.trump-pill-drag-surface' : '.trump-pill-grip';

  const display = displaySuit(state);
  const scale = trumpPillLayout.scale;

  const snapPoints = useMemo(
    () => snapPointsFromRects(getAnchorRects()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layoutTick forces re-measure after HUD moves
    [getAnchorRects, layoutTick, gameLogLayout, hudDockOffset]
  );

  const center = useMemo(() => {
    if (dragPos) return dragPos;
    return resolveTrumpPillCenter(trumpPillLayout, snapPoints);
  }, [dragPos, trumpPillLayout, snapPoints]);

  const dragPosition = useMemo(
    () => centerToDrag(center, scale),
    [center, scale]
  );

  useLayoutEffect(() => {
    setLayoutTick((t) => t + 1);
  }, [gameLogLayout.x, gameLogLayout.y, hudDockOffset.dx, hudDockOffset.dy, trumpPillLayout.snapId]);

  useLayoutEffect(() => {
    const bump = () => setLayoutTick((t) => t + 1);
    window.addEventListener('resize', bump);
    window.addEventListener('orientationchange', bump);
    return () => {
      window.removeEventListener('resize', bump);
      window.removeEventListener('orientationchange', bump);
    };
  }, []);

  const applyDragStop = useCallback(
    (centerX: number, centerY: number) => {
      const clamped = clampTrumpPillCenter(centerX, centerY);
      const points = snapPointsFromRects(getAnchorRects());
      const hit = nearestSnap(clamped.x, clamped.y, points);
      if (hit) {
        setTrumpPillLayout({
          snapId: hit.snapId,
          x: hit.offsetX,
          y: hit.offsetY,
        });
      } else {
        setTrumpPillLayout({
          snapId: null,
          x: clamped.x,
          y: clamped.y,
        });
      }
      setDragPos(null);
    },
    [getAnchorRects, setTrumpPillLayout]
  );

  const onDrag = useCallback(
    (_: unknown, data: DraggableData) => {
      setDragPos(dragToCenter({ x: data.x, y: data.y }, scale));
    },
    [scale]
  );

  const onStop = useCallback(
    (_: unknown, data: DraggableData) => {
      const c = dragToCenter({ x: data.x, y: data.y }, scale);
      applyDragStop(c.x, c.y);
    },
    [applyDragStop, scale]
  );

  if (!display || state.phase === 'setup' || state.players.length === 0) {
    return null;
  }

  return createPortal(
    <Draggable
      nodeRef={nodeRef}
      handle={dragHandle}
      position={dragPosition}
      onDrag={onDrag}
      onStop={onStop}
    >
      <PillWrap ref={nodeRef} $editMode={trumpEdit} $dimmed={dimmed}>
        <PillBody
          $scale={scale}
          $suit={display.suit}
          $dragSurface={trumpEdit}
          className={trumpEdit ? 'trump-pill-drag-surface' : undefined}
        >
          {SUIT_SYMBOL[display.suit]}
          <Grip
            type="button"
            className="trump-pill-grip"
            aria-label="Move trump indicator — snaps near score, log, or hand panel"
            title="Drag to move; release near a panel to snap"
          >
            ⠿
          </Grip>
        </PillBody>
        <Caption $scale={scale}>{display.label}</Caption>
        {display.sub && <Sub $scale={scale}>{display.sub}</Sub>}
      </PillWrap>
    </Draggable>,
    document.body
  );
};

export default TrumpSuitPill;
