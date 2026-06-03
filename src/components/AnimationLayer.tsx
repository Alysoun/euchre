import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { paceTimings } from '../game/gamePace';
import { getCardBackPath, getCardFrontPath } from '../utils/cardAssets';
import type { Card } from '../types/GameTypes';
import {
  dealSeatOrder,
  humanHandAnchor,
  seatAnchorCenter,
  tableCenterAnchor,
} from '../utils/animationAnchors';
import { soundManager } from '../utils/SoundEffects';

const Layer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 200;
  overflow: hidden;
`;

const FlyingCard = styled(motion.img)`
  position: fixed;
  pointer-events: none;
  width: 52px;
  height: auto;
  border-radius: 5px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.55);
  background: #fff;
`;

const DealCard = styled(motion.img)`
  position: fixed;
  pointer-events: none;
  width: 42px;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
`;

type Point = { x: number; y: number };

function arcPoints(from: Point, to: Point): Point[] {
  const cx = (from.x + to.x) / 2;
  const cy = Math.min(from.y, to.y) - Math.min(100, Math.abs(from.y - to.y) * 0.35 + 36);
  return [from, { x: cx, y: cy }, to];
}

const DealAnimation: React.FC<{
  dealerId: number;
  onDone: () => void;
  staggerMs: number;
  travelMs: number;
}> = ({ dealerId, onDone, staggerMs, travelMs }) => {
  const [origin, setOrigin] = useState<Point | null>(null);
  const cards = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);

  useEffect(() => {
    soundManager.play('shuffle');
    const center = tableCenterAnchor();
    if (!center) {
      onDone();
      return;
    }
    setOrigin(center);
    const totalMs = travelMs + staggerMs * (cards.length - 1) + 140;
    const timer = window.setTimeout(onDone, totalMs);
    return () => window.clearTimeout(timer);
  }, [cards.length, onDone, staggerMs, travelMs]);

  if (!origin) return null;

  return (
    <>
      {cards.map((index) => {
        const seat = dealSeatOrder(dealerId, index);
        const target =
          seat === 0 ? humanHandAnchor() ?? seatAnchorCenter(seat) : seatAnchorCenter(seat);
        if (!target) return null;
        const path = arcPoints(origin, target);
        const delay = (index * staggerMs) / 1000;
        return (
          <DealCard
            key={index}
            src={getCardBackPath('red')}
            alt=""
            draggable={false}
            initial={{ x: origin.x - 21, y: origin.y - 28, opacity: 0, scale: 0.7 }}
            animate={{
              x: [path[0].x - 21, path[1].x - 21, path[2].x - 21],
              y: [path[0].y - 28, path[1].y - 28, path[2].y - 28],
              opacity: [0, 1, 1],
              scale: [0.7, 1, 0.92],
            }}
            transition={{
              duration: travelMs / 1000,
              delay,
              ease: [0.22, 0.84, 0.32, 1],
              times: [0, 0.5, 1],
            }}
          />
        );
      })}
    </>
  );
};

const TrickCollectAnimation: React.FC<{
  trick: { playerId: number; card: Card }[];
  winnerId: number;
  onDone: () => void;
  durationMs: number;
}> = ({ trick, winnerId, onDone, durationMs }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const center = tableCenterAnchor();
    const winner =
      winnerId === 0 ? humanHandAnchor() ?? seatAnchorCenter(winnerId) : seatAnchorCenter(winnerId);
    if (!center || !winner) {
      onDone();
      return;
    }
    setReady(true);
    const timer = window.setTimeout(onDone, durationMs + trick.length * 70);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDone, trick.length, winnerId]);

  if (!ready) return null;

  const center = tableCenterAnchor();
  const winner =
    winnerId === 0 ? humanHandAnchor() ?? seatAnchorCenter(winnerId) : seatAnchorCenter(winnerId);
  if (!center || !winner) return null;

  return (
    <>
      {trick.map((play, index) => {
        const path = arcPoints(center, winner);
        return (
          <FlyingCard
            key={`${play.playerId}-${play.card.suit}-${play.card.value}-${index}`}
            src={getCardFrontPath(play.card.suit, play.card.value)}
            alt=""
            draggable={false}
            initial={{
              x: path[0].x - 26,
              y: path[0].y - 36,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: [path[0].x - 26, path[1].x - 26, path[2].x - 26],
              y: [path[0].y - 36, path[1].y - 36, path[2].y - 36],
              opacity: [1, 1, 0.35],
              scale: [1, 1, 0.55],
            }}
            transition={{
              duration: durationMs / 1000,
              delay: index * 0.07,
              ease: [0.25, 0.82, 0.3, 1],
              times: [0, 0.45, 1],
            }}
          />
        );
      })}
    </>
  );
};

const AnimationLayer: React.FC = () => {
  const { state, pause, gamePace, completeAnimationPause } = useGame();
  const timings = paceTimings(gamePace);

  if (pause.kind === 'dealing') {
    return (
      <Layer aria-hidden>
        <DealAnimation
          dealerId={state.dealerId}
          staggerMs={timings.dealCardStaggerMs}
          travelMs={timings.dealCardTravelMs}
          onDone={completeAnimationPause}
        />
      </Layer>
    );
  }

  if (pause.kind === 'trickCollect') {
    return (
      <Layer aria-hidden>
        <TrickCollectAnimation
          trick={pause.trick}
          winnerId={pause.winnerId}
          durationMs={Math.max(520, timings.trickCollectMs - pause.trick.length * 70)}
          onDone={completeAnimationPause}
        />
      </Layer>
    );
  }

  return null;
};

export default AnimationLayer;
