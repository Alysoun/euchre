import styled from 'styled-components';
import {
  TABLE_BOTTOM_INSET,
  TABLE_BOTTOM_INSET_PHONE,
  TABLE_BOTTOM_INSET_TABLET,
} from '../hudLayout';

export const TABLE_TILT = '64deg';
export const TABLE_PERSPECTIVE = '1400px';
export const TABLE_SIZE = 'min(94vmin, calc(100dvh - 200px), 920px)';

export const TableContainer = styled.div`
  --table-tilt: ${TABLE_TILT};
  --table-bottom: ${TABLE_BOTTOM_INSET};
  width: 100vw;
  width: 100dvw;
  height: 100vh;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 80% 50% at 50% 100%, rgba(0, 0, 0, 0.55) 0%, transparent 55%),
    radial-gradient(ellipse 120% 80% at 50% 40%, #1f3d28 0%, #0f1a12 55%, #080d09 100%);

  @media (max-width: 768px) {
    --table-bottom: ${TABLE_BOTTOM_INSET_TABLET};
  }

  @media (max-width: 480px) {
    --table-bottom: ${TABLE_BOTTOM_INSET_PHONE};
  }
`;

export const TableSceneWrap = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--table-bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  perspective: ${TABLE_PERSPECTIVE};
  perspective-origin: 50% 40%;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

export const TableShadow = styled.div`
  position: absolute;
  width: ${TABLE_SIZE};
  height: 72px;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%) translateZ(-120px) rotateX(90deg);
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.2) 45%,
    transparent 72%
  );
  filter: blur(8px);
  opacity: 0.85;
`;

export const TableStack = styled.div`
  position: relative;
  width: ${TABLE_SIZE};
  aspect-ratio: 1;
  transform: translateY(-1vh);
  transform-style: preserve-3d;
  overflow: visible;
`;

export const TableSurface = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  transform: rotateX(var(--table-tilt));
  transform-style: preserve-3d;
  overflow: visible;
`;

export const TableRail = styled.div`
  position: absolute;
  inset: -3.6%;
  border-radius: 50%;
  background: linear-gradient(165deg, #5c3d1e 0%, #3d2812 35%, #2a1a0c 70%, #1a1008 100%);
  box-shadow:
    0 28px 50px rgba(0, 0, 0, 0.65),
    inset 0 2px 4px rgba(255, 220, 160, 0.15),
    inset 0 -8px 16px rgba(0, 0, 0, 0.45);
  transform: translateZ(-14px);
`;

export const TableFelt = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255, 255, 255, 0.07) 0%, transparent 55%),
    radial-gradient(ellipse 100% 100% at 50% 50%, #327a4a 0%, #2a653d 42%, #1e4a2c 100%);
  box-shadow:
    inset 0 0 80px rgba(0, 0, 0, 0.35),
    inset 0 12px 24px rgba(255, 255, 255, 0.04),
    inset 0 -20px 40px rgba(0, 0, 0, 0.25);
  border: 3px solid rgba(90, 55, 25, 0.85);
  transform: translateZ(0);
  transform-style: preserve-3d;
  overflow: visible;
`;

export const SetupOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: auto;
`;

export const PhaseBanner = styled.div`
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 110;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.78);
  border: 1px solid rgba(255, 215, 0, 0.35);
  color: #ffd700;
  font-weight: 600;
  font-size: 0.88rem;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
`;
