import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from '../../types/GameTypes';
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

const CardFace = styled.div`
  img {
    width: 72px;
    height: auto;
    pointer-events: none;
    ${playingCardImgCss}
  }
`;

const CardBtn = styled.button<{
  $playable: boolean;
  $viewOnly: boolean;
  $index: number;
  $total: number;
  $hovered: boolean;
}>`
  position: absolute;
  left: 50%;
  bottom: 0;
  border: none;
  background: transparent;
  padding: 0;
  cursor: ${(p) => (p.$viewOnly ? 'default' : p.$playable ? 'pointer' : 'default')};
  transform-origin: center bottom;
  transform-style: preserve-3d;
  transform: ${(p) => cardFanTransform(p.$index, p.$total, p.$hovered && p.$playable)};
  transition: transform 0.18s ease, filter 0.18s ease;
  filter: ${(p) =>
    p.$viewOnly ? 'none' : p.$playable ? 'none' : 'brightness(0.55) saturate(0.7)'};

  &:disabled {
    cursor: not-allowed;
  }

  ${CardFace} img {
    ${(p) => (p.$playable && p.$hovered ? playingCardHighlightCss : '')}
  }
`;

const CardView = styled.div<{
  $index: number;
  $total: number;
}>`
  position: absolute;
  left: 50%;
  bottom: 0;
  transform-origin: center bottom;
  transform-style: preserve-3d;
  transform: ${(p) => cardFanTransform(p.$index, p.$total, false)};
`;

type HandFanProps = {
  cards: Card[];
  legalIds: Set<string>;
  onPlay: (card: Card) => void;
  disabled?: boolean;
  /** Show hand face-up for bidding / viewing only (no play). */
  viewOnly?: boolean;
};

const HandFan: React.FC<HandFanProps> = ({
  cards,
  legalIds,
  onPlay,
  disabled,
  viewOnly = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (cards.length === 0) return null;

  if (viewOnly) {
    return (
      <FanContainer $count={cards.length} data-anim-anchor="human-hand">
        {cards.map((card, index) => (
          <CardView key={card.id} $index={index} $total={cards.length}>
            <CardFace>
              <img
                src={getCardFrontPath(card.suit, card.value)}
                alt={`${card.value} of ${card.suit}`}
                draggable={false}
              />
            </CardFace>
          </CardView>
        ))}
      </FanContainer>
    );
  }

  return (
    <FanContainer $count={cards.length} data-anim-anchor="human-hand">
      {cards.map((card, index) => {
        const playable = !disabled && legalIds.has(card.id);
        const hovered = hoverIndex === index;
        return (
          <CardBtn
            key={card.id}
            type="button"
            disabled={!playable}
            $playable={playable}
            $viewOnly={false}
            $index={index}
            $total={cards.length}
            $hovered={hovered}
            style={{
              zIndex: computeCardStackZ({
                index,
                total: cards.length,
                playable,
                hovered,
              }),
            }}
            onMouseEnter={() => playable && setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => playable && onPlay(card)}
            aria-label={`Play ${card.value} of ${card.suit}`}
          >
            <CardFace>
              <img src={getCardFrontPath(card.suit, card.value)} alt="" draggable={false} />
            </CardFace>
          </CardBtn>
        );
      })}
    </FanContainer>
  );
};

export default HandFan;
