import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import { useHudAnchorRef } from '../context/HudAnchorContext';
import {
  EUCHRE_AI_DIFFICULTY_LABELS,
  type EuchreAIDifficulty,
} from '@playfield/core/euchre';
import { TeamId } from '../types/GameTypes';
import { allianceScoreboardLabel, humanTeamId } from '../utils/teamDisplay';

const Board = styled.div`
  position: fixed;
  top: max(12px, env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 110;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const BoardInner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.94) 100%);
  border: 2px solid rgba(255, 215, 0, 0.45);
  color: white;
  font-weight: 700;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
  pointer-events: none;
`;

const DifficultyPip = styled.div`
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 215, 0, 0.75);
  opacity: 0.9;
`;

const TeamScore = styled.div<{ $highlight?: boolean; $makers?: boolean }>`
  text-align: center;
  min-width: 88px;
  opacity: ${(p) => (p.$highlight ? 1 : 0.88)};
  color: ${(p) => (p.$highlight ? '#ffd700' : 'white')};

  ${(p) =>
    p.$makers
      ? `
    &::after {
      content: '★';
      margin-left: 4px;
      font-size: 0.75rem;
      color: #ffec8b;
    }
  `
      : ''}
`;

const Label = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const AllianceNames = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  opacity: 0.92;
  margin-bottom: 2px;
  text-transform: none;
  letter-spacing: 0;
`;

const ScoreNum = styled.div`
  font-size: 1.35rem;
  line-height: 1.1;
`;

const TrickPip = styled.div`
  font-size: 0.68rem;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: 500;
`;

const Divider = styled.div`
  width: 1px;
  height: 36px;
  background: rgba(255, 215, 0, 0.25);
`;

const EuchreScoreboard: React.FC = () => {
  const { state } = useGame();
  const scoreAnchorRef = useHudAnchorRef('score');
  if (state.players.length === 0) return null;

  const yourTeam = humanTeamId(state);

  const renderTeam = (team: TeamId) => {
    const isMaker = state.makerTeam === team && state.phase === 'playing';
    const tricks = state.tricksWon[team];
    const isYours = team === yourTeam;
    return (
      <TeamScore key={team} $highlight={isMaker} $makers={isMaker}>
        <Label>{isYours ? 'Your table' : 'Across the table'}</Label>
        <AllianceNames>{allianceScoreboardLabel(state, team)}</AllianceNames>
        <ScoreNum>{state.score[team]}</ScoreNum>
        {state.phase === 'playing' && (
          <TrickPip>
            {tricks} trick{tricks === 1 ? '' : 's'} this hand
          </TrickPip>
        )}
      </TeamScore>
    );
  };

  const difficulty = (state.aiDifficulty ?? 'easy') as EuchreAIDifficulty;

  return (
    <Board ref={scoreAnchorRef} aria-live="polite">
      <BoardInner>
        {renderTeam(0)}
        <Divider />
        {renderTeam(1)}
      </BoardInner>
      <DifficultyPip>
        Computers: {EUCHRE_AI_DIFFICULTY_LABELS[difficulty]}
      </DifficultyPip>
    </Board>
  );
};

export default EuchreScoreboard;
