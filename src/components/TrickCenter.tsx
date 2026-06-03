import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';
import { getCardFrontPath } from '../utils/cardAssets';
import { SUIT_SYMBOL } from '@playfield/core/euchre';
import { Card } from '../types/GameTypes';
import {
  feltCardTransform,
  trickCardTransformOrigin,
  trickLayerCounterRotateXDeg,
} from './table/feltCardTransform';
import { playingCardHighlightCss, playingCardImgCss } from './cards/playingCardImg';
import {
  BASE_TRICK_CARD_PX,
  TRICK_CENTER_LEFT_PCT,
  TRICK_CENTER_TOP_PCT,
  trickFanOffset,
} from './trickLayout';

const PREVIEW_CARDS: { playerId: number; card: Card }[] = [
  { playerId: 0, card: { id: 'preview-0', suit: 'hearts', value: 'A' } },
  { playerId: 1, card: { id: 'preview-1', suit: 'clubs', value: 'K' } },
  { playerId: 2, card: { id: 'preview-2', suit: 'diamonds', value: 'Q' } },
  { playerId: 3, card: { id: 'preview-3', suit: 'spades', value: 'J' } },
];

const TrickLayer = styled.div<{ $editMode?: boolean; $dimmed?: boolean }>`
  position: absolute;
  inset: -8%;
  pointer-events: ${(p) => (p.$editMode ? 'auto' : 'none')};
  transform: translateZ(40px);
  transform-style: preserve-3d;
  opacity: ${(p) => (p.$dimmed ? 0.35 : 1)};
  transition: opacity 0.15s ease;

  ${(p) =>
    p.$editMode
      ? `
    outline: 1px dashed rgba(120, 200, 255, 0.45);
    outline-offset: 4px;
    border-radius: 50%;
  `
      : ''}
`;

const TrickCenterAnchor = styled.div<{
  $offsetX: number;
  $offsetY: number;
  $facePlayer: number;
}>`
  position: absolute;
  left: calc(${TRICK_CENTER_LEFT_PCT}% + ${(p) => p.$offsetX}px);
  top: calc(${TRICK_CENTER_TOP_PCT}% + ${(p) => p.$offsetY}px);
  transform: translate(-50%, -50%)
    rotateX(${(p) => trickLayerCounterRotateXDeg(p.$facePlayer)}deg);
  transform-style: preserve-3d;
  transform-origin: center center;
`;

const CardSlot = styled.div<{
  $dx: number;
  $dy: number;
  $stackIndex: number;
  $highlight?: boolean;
  $preview?: boolean;
}>`
  position: absolute;
  left: 0;
  top: 0;
  transform: translate3d(calc(-50% + ${(p) => p.$dx}px), calc(-50% + ${(p) => p.$dy}px), 16px);
  transform-style: preserve-3d;
  z-index: ${(p) => (p.$highlight ? 14 : 8 + p.$stackIndex)};
  opacity: ${(p) => (p.$preview ? 0.72 : 1)};
`;

const CardMotion = styled(motion.div)`
  transform-style: preserve-3d;
`;

const CardFace = styled.div<{
  $highlight?: boolean;
  $cardPx: number;
  $facePlayer: number;
}>`
  transform: ${(p) => feltCardTransform(p.$facePlayer)};
  transform-style: preserve-3d;
  transform-origin: ${(p) => trickCardTransformOrigin(p.$facePlayer)};

  img {
    width: ${(p) => p.$cardPx}px;
    height: auto;
    ${playingCardImgCss}
    ${(p) => (p.$highlight ? playingCardHighlightCss : '')}
  }
`;

const TurnedSpot = styled(motion.div)`
  position: absolute;
  left: 0;
  top: -80px;
  transform: translate(-50%, -50%) translate3d(0, 0, 40px);
  transform-style: preserve-3d;
  text-align: center;
  z-index: 8;
  color: white;
  font-size: 0.72rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
`;

const TurnedCardFace = styled.div<{ $cardPx: number; $facePlayer: number }>`
  transform: ${(p) => feltCardTransform(p.$facePlayer)};
  transform-origin: ${(p) => trickCardTransformOrigin(p.$facePlayer)};
  margin-top: 6px;

  img {
    width: ${(p) => p.$cardPx}px;
    height: auto;
    ${playingCardImgCss}
  }
`;

const KittyLabel = styled.span`
  display: inline-block;
  margin-top: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
`;

const TrickCenter: React.FC = () => {
  const { state, visibleTrick, lastRevealPlay, pause } = useGame();
  const { trickLayout, layoutEditMode, isEditingLayoutGroup } = useHudLayout();
  const trickEditMode = isEditingLayoutGroup('trick');
  const trickDimmed = layoutEditMode && !trickEditMode;

  const showTurned =
    state.turnedCard &&
    (state.phase === 'bidding' || state.phase === 'biddingRound2') &&
    pause.kind !== 'dealing';

  const lastKey = lastRevealPlay
    ? `${lastRevealPlay.playerId}-${lastRevealPlay.card.id}`
    : null;

  const cardPx = Math.round(BASE_TRICK_CARD_PX * trickLayout.cardScale);
  const highlightPx = Math.round(cardPx * 1.08);
  const turnedPx = Math.round(68 * trickLayout.cardScale);

  const showTrickCards =
    state.phase === 'playing' &&
    visibleTrick.length > 0 &&
    pause.kind !== 'trickCollect';

  const plays = showTrickCards
    ? visibleTrick.map((play) => ({ ...play, preview: false }))
    : trickEditMode
      ? PREVIEW_CARDS.map((p) => ({ ...p, preview: true }))
      : [];

  return (
    <TrickLayer $editMode={trickEditMode} $dimmed={trickDimmed}>
      <TrickCenterAnchor
        data-anim-anchor="table-center"
        $offsetX={trickLayout.offsetX}
        $offsetY={trickLayout.offsetY}
        $facePlayer={trickLayout.facePlayer}
      >
        <AnimatePresence>
          {showTurned && state.turnedCard && (
            <TurnedSpot
              key="turned"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div>Turned card</div>
              <TurnedCardFace $cardPx={turnedPx} $facePlayer={trickLayout.facePlayer}>
                <img
                  src={getCardFrontPath(state.turnedCard.suit, state.turnedCard.value)}
                  alt="Turned card"
                />
              </TurnedCardFace>
              <KittyLabel>{SUIT_SYMBOL[state.turnedCard.suit]} to order</KittyLabel>
            </TurnedSpot>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {plays.map((play, stackIndex) => {
            const nudge = trickFanOffset(play.playerId, trickLayout.spread, {
              goAlone: state.goAlone,
              stackIndex,
            });
            const playKey = `${play.playerId}-${play.card.id}`;
            const highlight = !play.preview && lastKey === playKey;
            const sizePx = highlight ? highlightPx : cardPx;
            return (
              <CardSlot
                key={playKey}
                $highlight={highlight}
                $preview={play.preview}
                $stackIndex={stackIndex}
                $dx={nudge.dx}
                $dy={nudge.dy}
              >
                <CardMotion
                  initial={{ opacity: 0, scale: 0.55 }}
                  animate={{ opacity: 1, scale: highlight ? 1.06 : 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                >
                  <CardFace
                    $highlight={highlight}
                    $cardPx={sizePx}
                    $facePlayer={trickLayout.facePlayer}
                  >
                    <img src={getCardFrontPath(play.card.suit, play.card.value)} alt="" />
                  </CardFace>
                </CardMotion>
              </CardSlot>
            );
          })}
        </AnimatePresence>
      </TrickCenterAnchor>
    </TrickLayer>
  );
};

export default TrickCenter;
