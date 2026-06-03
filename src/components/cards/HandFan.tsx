import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Card } from '../../types/GameTypes';
import { EUCHRE_PLAY_DRAG } from '../../game/cardDrag';
import { getCardFrontPath } from '../../utils/cardAssets';
import {
  cardFanTransform,
  computeCardStackZ,
  fanContainerSize,
} from '../../utils/cardFanStack';
import { playingCardHighlightCss, playingCardImgCss } from './playingCardImg';

const FanContainer = styled.div<{ $count: number }>`
  position: relative;
  width: ${(p) => fanContainerSize(p.$count).width}px;
  height: ${(p) => fanContainerSize(p.$count).height}px;
  margin: 0 auto;
  overflow: visible;
  transform-style: preserve-3d;
  perspective: 900px;
`;

const CardFace = styled.div<{ $dimmed?: boolean; $dragOver?: boolean }>`
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  line-height: 0;
  transform: ${(p) => (p.$dragOver ? 'scale(1.04)' : 'none')};
  filter: ${(p) => (p.$dimmed ? 'brightness(0.72) saturate(0.85)' : 'none')};

  img {
    width: 72px;
    height: auto;
    display: block;
    pointer-events: none;
    ${playingCardImgCss}
  }
`;

const CardBtn = styled.button<{
  $playable: boolean;
  $canPlay: boolean;
  $index: number;
  $total: number;
  $dragging: boolean;
  $hovered: boolean;
}>`
  position: absolute;
  left: 50%;
  bottom: 0;
  border: none;
  background: transparent;
  padding: 0;
  cursor: ${(p) => (p.$canPlay && p.$playable ? 'pointer' : 'grab')};
  transform-origin: center bottom;
  transform-style: preserve-3d;
  transform: ${(p) => cardFanTransform(p.$index, p.$total, p.$hovered && p.$playable && p.$canPlay)};
  transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
  opacity: ${(p) => (p.$dragging ? 0.82 : 1)};
  filter: ${(p) =>
    p.$canPlay && !p.$playable ? 'brightness(0.55) saturate(0.7)' : 'none'};

  &:active {
    cursor: ${(p) => (p.$canPlay && p.$playable ? 'pointer' : 'grabbing')};
  }

  ${CardFace} img {
    ${(p) => (p.$canPlay && p.$playable && p.$hovered ? playingCardHighlightCss : '')}
  }
`;

type HandFanProps = {
  cards: Card[];
  legalIds: Set<string>;
  onPlay: (card: Card) => void;
  onReorder: (from: number, to: number) => void;
  disabled?: boolean;
  /** Disable drag reorder / play (layout edit mode). */
  dragDisabled?: boolean;
  /** Show hand face-up without playing (bidding) — reorder still allowed. */
  viewOnly?: boolean;
};

const HandFan: React.FC<HandFanProps> = ({
  cards,
  legalIds,
  onPlay,
  onReorder,
  disabled,
  dragDisabled = false,
  viewOnly = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const clickStart = useRef<{ x: number; y: number } | null>(null);
  const didReorder = useRef(false);

  if (cards.length === 0) return null;

  const canPlayActions = !viewOnly && !disabled && !dragDisabled;

  const tryPlayFromClick = (card: Card, clientX: number, clientY: number) => {
    if (!canPlayActions || !legalIds.has(card.id)) return;
    if (didReorder.current) {
      didReorder.current = false;
      return;
    }
    if (clickStart.current) {
      const dx = clientX - clickStart.current.x;
      const dy = clientY - clickStart.current.y;
      if (Math.hypot(dx, dy) > 10) return;
    }
    onPlay(card);
  };

  return (
    <FanContainer $count={cards.length} data-anim-anchor="human-hand">
      {cards.map((card, index) => {
        const playable = canPlayActions && legalIds.has(card.id);
        const dragging = dragIndex === index;
        const hovered = hoverIndex === index;
        return (
          <CardBtn
            key={card.id}
            type="button"
            $playable={playable}
            $canPlay={canPlayActions}
            $index={index}
            $total={cards.length}
            $dragging={dragging}
            $hovered={hovered}
            draggable={!dragDisabled}
            style={{
              zIndex: computeCardStackZ({
                index,
                total: cards.length,
                dragging,
                playable,
                hovered,
              }),
            }}
            onMouseEnter={() => !dragDisabled && setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex((prev) => (prev === index ? null : prev))}
            onPointerDown={(e) => {
              if (dragDisabled) return;
              clickStart.current = { x: e.clientX, y: e.clientY };
            }}
            onDragStart={(e) => {
              if (dragDisabled) {
                e.preventDefault();
                return;
              }
              didReorder.current = false;
              setDragIndex(index);
              if (playable) {
                e.dataTransfer.setData(EUCHRE_PLAY_DRAG, card.id);
              }
              e.dataTransfer.setData('text/plain', card.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDropTarget(null);
              clickStart.current = null;
            }}
            onDragOver={(e) => {
              if (dragDisabled) return;
              e.preventDefault();
              setDropTarget(index);
            }}
            onDragLeave={() => {
              if (dropTarget === index) setDropTarget(null);
            }}
            onDrop={(e) => {
              if (dragDisabled) return;
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== index) {
                didReorder.current = true;
                onReorder(dragIndex, index);
              }
              setDragIndex(null);
              setDropTarget(null);
            }}
            onClick={(e) => tryPlayFromClick(card, e.clientX, e.clientY)}
            aria-label={
              viewOnly
                ? `${card.value} of ${card.suit}`
                : playable
                  ? `Play ${card.value} of ${card.suit}`
                  : `${card.value} of ${card.suit}`
            }
          >
            <CardFace
              $dimmed={canPlayActions && !playable}
              $dragOver={dropTarget === index && dragIndex !== index}
            >
              <img
                src={getCardFrontPath(card.suit, card.value)}
                alt={`${card.value} of ${card.suit}`}
                draggable={false}
              />
            </CardFace>
          </CardBtn>
        );
      })}
    </FanContainer>
  );
};

export default HandFan;
