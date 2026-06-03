import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';

import { Z_TABLE_CONTROLS } from './hudPanelLayout';

const CONTROLS_Z = Z_TABLE_CONTROLS;

const Cluster = styled.div`
  position: fixed;
  top: max(12px, env(safe-area-inset-top, 0px));
  right: max(148px, calc(env(safe-area-inset-right, 0px) + 136px));
  z-index: ${CONTROLS_Z};
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }

  @media (max-width: 768px) {
    right: max(128px, calc(env(safe-area-inset-right, 0px) + 116px));
    gap: 6px;
  }

  @media (max-width: 480px) {
    right: max(108px, calc(env(safe-area-inset-right, 0px) + 96px));
  }
`;

const IconBtn = styled.button<{ $active?: boolean }>`
  padding: 10px 12px;
  border-radius: 20px;
  border: 1px solid
    ${(p) => (p.$active ? 'rgba(255, 215, 0, 0.75)' : 'rgba(255, 255, 255, 0.28)')};
  background: ${(p) =>
    p.$active ? 'rgba(40, 36, 12, 0.94)' : 'rgba(0, 0, 0, 0.72)'};
  color: ${(p) => (p.$active ? '#ffd700' : '#eee')};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);

  &:hover {
    filter: brightness(1.08);
  }
`;

const EuchreTableControls: React.FC = () => {
  const { state } = useGame();
  const { layoutEditMode, toggleLayoutEditMode, resetLayout } = useHudLayout();

  if (state.phase === 'setup' || state.players.length === 0) return null;

  return createPortal(
    <Cluster>
      {layoutEditMode && (
        <IconBtn
          type="button"
          onClick={resetLayout}
          aria-label="Reset UI layout"
          title="Reset game log, labels, trump pill, and hand panel positions"
        >
          ⟲
        </IconBtn>
      )}
      <IconBtn
        type="button"
        $active={layoutEditMode}
        onClick={toggleLayoutEditMode}
        aria-pressed={layoutEditMode}
        aria-label={
          layoutEditMode ? 'Done moving UI — resume game' : 'Move UI panels and labels'
        }
        title={
          layoutEditMode
            ? 'Done moving UI'
            : 'Pause and move game log, trump pill, opponent labels, and your hand panel'
        }
      >
        ⠿
      </IconBtn>
    </Cluster>,
    document.body
  );
};

export default EuchreTableControls;
