import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { soundManager } from '../utils/SoundEffects';
import { formatHandSummaryDisplay } from '../utils/teamDisplay';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 24px;
`;

const Box = styled.div`
  background: #0f1a12;
  border: 2px solid #ffd700;
  border-radius: 14px;
  padding: 24px;
  color: white;
  max-width: 420px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h2`
  margin: 0 0 12px;
  color: #ffd700;
`;

const Line = styled.p`
  margin: 6px 0;
  line-height: 1.45;
`;

const Btn = styled.button`
  margin-top: 18px;
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  background: #ffd700;
  color: #000;
  font-weight: 700;
  cursor: pointer;
`;

const HandSummaryModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const display = formatHandSummaryDisplay(state);
  if (!display) return null;
  if (state.phase !== 'handSummary' && state.phase !== 'gameOver') return null;

  return (
    <Overlay role="dialog" aria-modal="true">
      <Box>
        <Title>{display.title}</Title>
        {display.lines.map((line) => (
          <Line key={line}>{line}</Line>
        ))}
        <Btn
          type="button"
          onClick={() => {
            void soundManager.unlock().then(() => {
              soundManager.play('buttonClick');
              dispatch({ type: 'DISMISS_HAND_SUMMARY' });
            });
          }}
        >
          {state.phase === 'gameOver' ? 'New game' : 'Next hand'}
        </Btn>
      </Box>
    </Overlay>
  );
};

export default HandSummaryModal;
