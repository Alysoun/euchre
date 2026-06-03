import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';
import {
  LAYOUT_EDIT_GROUP_HINTS,
  LAYOUT_EDIT_GROUP_LABELS,
  LAYOUT_EDIT_GROUP_ORDER,
  MAX_SEAT_LABEL_SCALE,
  MIN_GAME_LOG_WIDTH,
  MIN_SEAT_LABEL_SCALE,
  MIN_TRICK_CARD_SCALE,
  MIN_TRICK_OFFSET_X,
  MIN_TRICK_OFFSET_Y,
  MIN_TRICK_SPREAD,
  MAX_HUD_HAND_SCALE,
  MIN_HUD_HAND_SCALE,
  MAX_TRICK_CARD_SCALE,
  MAX_TRICK_OFFSET_X,
  MAX_TRICK_OFFSET_Y,
  MAX_TRICK_SPREAD,
  MAX_TRICK_FACE_PLAYER,
  MIN_TRICK_FACE_PLAYER,
  MAX_TRUMP_PILL_SCALE,
  MIN_TRUMP_PILL_SCALE,
  Z_LAYOUT_EDIT_BACKDROP,
  Z_LAYOUT_EDIT_BANNER,
  maxGameLogHeight,
  maxGameLogWidth,
  minGameLogHeight,
} from './hudPanelLayout';

const Shell = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${Z_LAYOUT_EDIT_BANNER};
  pointer-events: none;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${Z_LAYOUT_EDIT_BACKDROP};
  background: rgba(0, 16, 32, 0.32);
`;

const Banner = styled.div`
  position: absolute;
  top: max(8px, calc(env(safe-area-inset-top, 0px) + 6px));
  left: 50%;
  transform: translateX(-50%);
  z-index: ${Z_LAYOUT_EDIT_BANNER};
  width: min(620px, calc(100vw - 24px));
  pointer-events: auto;
  padding: 12px 16px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.96);
  border: 1px solid rgba(255, 215, 0, 0.45);
  color: #eee;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65);
  text-align: center;
  line-height: 1.45;
  font-size: 0.86rem;

  strong {
    display: block;
    color: #ffd700;
    font-size: 0.98rem;
    margin-bottom: 4px;
  }
`;

const GroupRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 10px 0 8px;
`;

const GroupBtn = styled.button<{ $active?: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? '#ffd700' : 'rgba(255, 255, 255, 0.25)')};
  background: ${(p) => (p.$active ? 'rgba(255, 215, 0, 0.18)' : 'rgba(255, 255, 255, 0.06)')};
  color: ${(p) => (p.$active ? '#ffd700' : '#ddd')};
  font-size: 0.82rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  cursor: pointer;
  min-height: 40px;
`;

const Hint = styled.p`
  margin: 0;
  color: #bbb;
  font-size: 0.8rem;
`;

const ScaleControl = styled.label`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  margin-top: 10px;
  color: #ffd700;
  font-size: 0.8rem;

  input[type='range'] {
    width: min(180px, 40vw);
  }
`;

const LayoutEditOverlay: React.FC = () => {
  const { state } = useGame();
  const {
    layoutEditMode,
    layoutEditGroup,
    setLayoutEditGroup,
    seatLabelScale,
    setSeatLabelScale,
    gameLogLayout,
    setGameLogLayout,
    trickLayout,
    setTrickLayout,
    trumpPillLayout,
    setTrumpPillLayout,
    hudHandScale,
    setHudHandScale,
  } = useHudLayout();

  if (!layoutEditMode || state.phase === 'setup' || state.players.length === 0) {
    return null;
  }

  return createPortal(
    <Shell aria-hidden={false}>
      <Backdrop aria-hidden />
      <Banner role="status" aria-live="polite">
        <strong>Layout mode — game paused</strong>
        Choose one group to adjust. Tap ⠿ (top right) when finished.
        <GroupRow role="tablist" aria-label="Layout groups">
          {LAYOUT_EDIT_GROUP_ORDER.map((group) => (
            <GroupBtn
              key={group}
              type="button"
              role="tab"
              aria-selected={layoutEditGroup === group}
              $active={layoutEditGroup === group}
              onClick={() => setLayoutEditGroup(group)}
            >
              {LAYOUT_EDIT_GROUP_LABELS[group]}
            </GroupBtn>
          ))}
        </GroupRow>
        <Hint>{LAYOUT_EDIT_GROUP_HINTS[layoutEditGroup]}</Hint>
        {layoutEditGroup === 'opponents' && (
          <ScaleControl>
            Opponent label size
            <input
              type="range"
              min={MIN_SEAT_LABEL_SCALE}
              max={MAX_SEAT_LABEL_SCALE}
              step={0.05}
              value={seatLabelScale}
              onChange={(e) => setSeatLabelScale(Number(e.target.value))}
              aria-label="Opponent label size"
            />
            {Math.round(seatLabelScale * 100)}%
          </ScaleControl>
        )}
        {layoutEditGroup === 'trick' && (
          <>
            <ScaleControl>
              Down / up
              <input
                type="range"
                min={MIN_TRICK_OFFSET_Y}
                max={MAX_TRICK_OFFSET_Y}
                step={2}
                value={trickLayout.offsetY}
                onChange={(e) => setTrickLayout({ offsetY: Number(e.target.value) })}
                aria-label="Trick card vertical position"
              />
              {trickLayout.offsetY}px
            </ScaleControl>
            <ScaleControl>
              Left / right
              <input
                type="range"
                min={MIN_TRICK_OFFSET_X}
                max={MAX_TRICK_OFFSET_X}
                step={2}
                value={trickLayout.offsetX}
                onChange={(e) => setTrickLayout({ offsetX: Number(e.target.value) })}
                aria-label="Trick card horizontal position"
              />
              {trickLayout.offsetX}px
            </ScaleControl>
            <ScaleControl>
              Spread
              <input
                type="range"
                min={MIN_TRICK_SPREAD}
                max={MAX_TRICK_SPREAD}
                step={0.05}
                value={trickLayout.spread}
                onChange={(e) => setTrickLayout({ spread: Number(e.target.value) })}
                aria-label="Trick card spread"
              />
              {Math.round(trickLayout.spread * 100)}%
            </ScaleControl>
            <ScaleControl>
              Card size
              <input
                type="range"
                min={MIN_TRICK_CARD_SCALE}
                max={MAX_TRICK_CARD_SCALE}
                step={0.05}
                value={trickLayout.cardScale}
                onChange={(e) => setTrickLayout({ cardScale: Number(e.target.value) })}
                aria-label="Trick card size"
              />
              {Math.round(trickLayout.cardScale * 100)}%
            </ScaleControl>
            <ScaleControl>
              Face toward you
              <input
                type="range"
                min={MIN_TRICK_FACE_PLAYER}
                max={MAX_TRICK_FACE_PLAYER}
                step={5}
                value={trickLayout.facePlayer}
                onChange={(e) => setTrickLayout({ facePlayer: Number(e.target.value) })}
                aria-label="How much trick cards face toward you"
              />
              {trickLayout.facePlayer}%
            </ScaleControl>
          </>
        )}
        {layoutEditGroup === 'hud' && (
          <ScaleControl>
            Hand size
            <input
              type="range"
              min={MIN_HUD_HAND_SCALE}
              max={MAX_HUD_HAND_SCALE}
              step={0.05}
              value={hudHandScale}
              onChange={(e) => setHudHandScale(Number(e.target.value))}
              aria-label="Hand card size"
            />
            {Math.round(hudHandScale * 100)}%
          </ScaleControl>
        )}
        {layoutEditGroup === 'trump' && (
          <ScaleControl>
            Pill size
            <input
              type="range"
              min={MIN_TRUMP_PILL_SCALE}
              max={MAX_TRUMP_PILL_SCALE}
              step={0.05}
              value={trumpPillLayout.scale}
              onChange={(e) => setTrumpPillLayout({ scale: Number(e.target.value) })}
              aria-label="Trump pill size"
            />
            {Math.round(trumpPillLayout.scale * 100)}%
          </ScaleControl>
        )}
        {layoutEditGroup === 'log' && (
          <>
            <ScaleControl>
              Log width
              <input
                type="range"
                min={MIN_GAME_LOG_WIDTH}
                max={maxGameLogWidth(true)}
                step={4}
                value={gameLogLayout.width}
                onChange={(e) => setGameLogLayout({ width: Number(e.target.value) })}
                aria-label="Game log width"
              />
              {gameLogLayout.width}px
            </ScaleControl>
            <ScaleControl>
              Log height
              <input
                type="range"
                min={minGameLogHeight(true, false)}
                max={maxGameLogHeight(true)}
                step={4}
                value={gameLogLayout.height}
                onChange={(e) => setGameLogLayout({ height: Number(e.target.value) })}
                aria-label="Game log height"
              />
              {gameLogLayout.height}px
            </ScaleControl>
          </>
        )}
      </Banner>
    </Shell>,
    document.body
  );
};

export default LayoutEditOverlay;
