import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { useHudLayout } from '../context/HudLayoutContext';
import { SUITS, SUIT_SYMBOL, PHASE_LABELS } from '@playfield/core/euchre';
import { soundManager } from '../utils/SoundEffects';

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
`;

const Btn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 10px 18px;
  border-radius: 999px;
  border: 2px solid
    ${(p) => (p.$primary ? '#ffd700' : p.$danger ? 'rgba(255, 120, 120, 0.6)' : 'rgba(255, 255, 255, 0.22)')};
  background: ${(p) =>
    p.$primary
      ? 'linear-gradient(180deg, #ffe566 0%, #ffd700 45%, #c9a800 100%)'
      : p.$danger
        ? 'rgba(80, 24, 24, 0.9)'
        : 'rgba(0, 0, 0, 0.55)'};
  color: ${(p) => (p.$primary ? '#1a1200' : '#fff')};
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  min-height: 44px;
  box-shadow: ${(p) => (p.$primary ? '0 4px 14px rgba(255, 215, 0, 0.35)' : '0 4px 12px rgba(0,0,0,0.35)')};
  transition: transform 0.12s ease, filter 0.12s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Hint = styled.p`
  margin: 0 0 10px;
  font-size: 0.86rem;
  opacity: 0.9;
  text-align: center;
  line-height: 1.45;
`;

const PhaseTitle = styled.div`
  margin: 0 0 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  border: 1px solid rgba(255, 215, 0, 0.35);
  color: #ffd700;
  font-size: 0.84rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.02em;
`;

const WaitNote = styled.p`
  margin: 0;
  font-size: 0.86rem;
  opacity: 0.85;
  text-align: center;
  color: #ffec8b;
`;

const click = (fn: () => void) => () => {
  void soundManager.unlock().then(() => {
    soundManager.play('buttonClick');
    fn();
  });
};

const EuchreActionBar: React.FC = () => {
  const { state, dispatch, canInteract, pause } = useGame();
  const { layoutEditMode } = useHudLayout();
  const human = state.players.find((p) => p.isHuman);
  const isHumanTurn = human && state.currentPlayer === human.id;
  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase;

  if (layoutEditMode) return null;

  if (!human) return null;

  if (!canInteract && isHumanTurn && pause.kind === 'turnedReveal') {
    return (
      <div>
        <PhaseTitle>{phaseLabel}</PhaseTitle>
        <WaitNote>Review the turned card — your bid buttons appear in a moment.</WaitNote>
      </div>
    );
  }

  if (!canInteract || !isHumanTurn) {
    return null;
  }

  if (state.phase === 'bidding') {
    const suit = state.turnedCard ? SUIT_SYMBOL[state.turnedCard.suit] : '';
    return (
      <div>
        <PhaseTitle>{phaseLabel}</PhaseTitle>
        <Hint>Order up the turned suit as trump, go alone, or pass.</Hint>
        <Bar>
          <Btn
            $primary
            type="button"
            onClick={click(() => dispatch({ type: 'BID', action: 'orderUp' }))}
          >
            Order up {suit}
          </Btn>
          <Btn
            type="button"
            onClick={click(() =>
              dispatch({ type: 'BID', action: 'orderUp', goAlone: true })
            )}
          >
            Go alone {suit}
          </Btn>
          <Btn type="button" onClick={click(() => dispatch({ type: 'BID', action: 'pass' }))}>
            Pass
          </Btn>
        </Bar>
      </div>
    );
  }

  if (state.phase === 'biddingRound2' || state.phase === 'stickTheDealer') {
    const turned = state.turnedCard?.suit;
    const stuck = state.phase === 'stickTheDealer';
    const isDealer = human.id === state.dealerId;
    if (stuck && !isDealer) {
      return (
        <div>
          <PhaseTitle>{phaseLabel}</PhaseTitle>
          <WaitNote>Dealer must name trump — stick the dealer.</WaitNote>
        </div>
      );
    }
    return (
      <div>
        <PhaseTitle>{phaseLabel}</PhaseTitle>
        <Hint>
          {stuck
            ? 'You must name trump — no pass (stick the dealer).'
            : 'Name trump (not the turned color), go alone, or pass.'}
        </Hint>
        <Bar>
          {SUITS.filter((suit) => suit !== turned).map((suit) => (
            <Btn
              key={suit}
              type="button"
              onClick={click(() => dispatch({ type: 'BID', action: 'nameTrump', suit }))}
            >
              {SUIT_SYMBOL[suit]} Trump
            </Btn>
          ))}
          {SUITS.filter((suit) => suit !== turned).map((suit) => (
            <Btn
              key={`alone-${suit}`}
              type="button"
              onClick={click(() =>
                dispatch({ type: 'BID', action: 'nameTrump', suit, goAlone: true })
              )}
            >
              Alone {SUIT_SYMBOL[suit]}
            </Btn>
          ))}
          {!stuck && (
            <Btn type="button" onClick={click(() => dispatch({ type: 'BID', action: 'pass' }))}>
              Pass
            </Btn>
          )}
        </Bar>
      </div>
    );
  }

  if (state.phase === 'dealerDiscard' && human.id === state.dealerId) {
    return (
      <div>
        <PhaseTitle>{phaseLabel}</PhaseTitle>
        <Hint>Tap a card in your fan to discard (you picked up the turned card).</Hint>
      </div>
    );
  }

  if (state.phase === 'playing') {
    return (
      <div>
        <PhaseTitle>{phaseLabel}</PhaseTitle>
        <Hint>
          Tap a highlighted card in your fan to play. Glowing cards are legal plays.
        </Hint>
      </div>
    );
  }

  return null;
};

export default EuchreActionBar;
