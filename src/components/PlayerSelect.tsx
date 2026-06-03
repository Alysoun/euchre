import React, { useState } from 'react';
import styled from 'styled-components';
import {
  EUCHRE_AI_DIFFICULTY_HINTS,
  EUCHRE_AI_DIFFICULTY_LABELS,
  EUCHRE_AI_DIFFICULTY_ORDER,
  type EuchreAIDifficulty,
} from '@playfield/core/euchre';
import { SeatConfig } from '../types/GameTypes';
import { loadStoredAiDifficulty, saveStoredAiDifficulty } from '../game/aiSettings';
import { GAME_NAME, GAME_TAGLINE } from '../game/branding';
import {
  loadStoredPlayerName,
  saveStoredPlayerName,
  sanitizePlayerName,
  formatPlayerNameInput,
} from '../utils/playerName';
import { soundManager } from '../utils/SoundEffects';

const SelectContainer = styled.div`
  background: linear-gradient(165deg, rgba(12, 22, 16, 0.97) 0%, rgba(0, 0, 0, 0.96) 100%);
  padding: 2rem 2rem 1.75rem;
  border-radius: 16px;
  text-align: center;
  min-width: min(440px, calc(100vw - 24px));
  max-width: min(520px, calc(100vw - 16px));
  border: 2px solid #ffd700;
  color: white;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
`;

const Title = styled.h1`
  margin: 0 0 0.35rem;
  color: #ffd700;
  font-size: 1.75rem;
  letter-spacing: 0.03em;
`;

const Subtitle = styled.p`
  margin: 0 0 1.25rem;
  opacity: 0.88;
  line-height: 1.5;
  font-size: 0.92rem;
`;

const Label = styled.label`
  display: block;
  text-align: left;
  margin-bottom: 0.35rem;
  font-size: 0.88rem;
  color: rgba(255, 215, 0, 0.85);
`;

const NameInput = styled.input`
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 0, 0.35);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  margin-bottom: 1.1rem;
  font-size: 1rem;

  &:focus {
    outline: 2px solid rgba(255, 215, 0, 0.5);
    outline-offset: 1px;
  }
`;

const SeatDiagram = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 1.25rem;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 45%, #327a4a 0%, #1e4a2c 100%);
  border: 4px solid #5c3a1e;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.35);
`;

const SeatDot = styled.div<{ $pos: 'bottom' | 'left' | 'top' | 'right'; $you?: boolean }>`
  position: absolute;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${(p) => (p.$you ? 'rgba(255, 215, 0, 0.9)' : 'rgba(0,0,0,0.75)')};
  color: ${(p) => (p.$you ? '#1a1200' : '#fff')};
  border: 1px solid ${(p) => (p.$you ? '#fff' : 'rgba(255,255,255,0.2)')};

  ${(p) => {
    switch (p.$pos) {
      case 'bottom':
        return 'left: 50%; bottom: 8px; transform: translateX(-50%);';
      case 'top':
        return 'left: 50%; top: 8px; transform: translateX(-50%);';
      case 'left':
        return 'left: 8px; top: 50%; transform: translateY(-50%);';
      case 'right':
        return 'right: 8px; top: 50%; transform: translateY(-50%);';
    }
  }}
`;

const DifficultySelect = styled.select`
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 0, 0.35);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 0.95rem;
  margin-bottom: 0.45rem;
  cursor: pointer;

  &:focus {
    outline: 2px solid rgba(255, 215, 0, 0.5);
    outline-offset: 1px;
  }
`;

const DifficultyHint = styled.p`
  margin: 0 0 1rem;
  text-align: left;
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.72);
`;

const StartButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffe566 0%, #ffd700 50%, #c9a800 100%);
  color: #1a1200;
  font-weight: 800;
  font-size: 1.05rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(255, 215, 0, 0.35);

  &:hover {
    filter: brightness(1.05);
  }
`;

interface PlayerSelectProps {
  onStart: (seats: SeatConfig[], aiDifficulty: EuchreAIDifficulty) => void;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({ onStart }) => {
  const [humanName, setHumanName] = useState(() => loadStoredPlayerName());
  const [aiDifficulty, setAiDifficulty] = useState<EuchreAIDifficulty>(() =>
    loadStoredAiDifficulty()
  );

  const handleStart = () => {
    void soundManager.unlock();
    const name = sanitizePlayerName(humanName);
    saveStoredPlayerName(name);
    saveStoredAiDifficulty(aiDifficulty);
    const seats: SeatConfig[] = [
      { isHuman: true, name },
      { isHuman: false },
      { isHuman: false },
      { isHuman: false },
    ];
    onStart(seats, aiDifficulty);
  };

  return (
    <SelectContainer>
      <Title>{GAME_NAME}</Title>
      <Subtitle>{GAME_TAGLINE}</Subtitle>
      <SeatDiagram aria-hidden>
        <SeatDot $pos="bottom" $you>
          You
        </SeatDot>
        <SeatDot $pos="left">Left opp.</SeatDot>
        <SeatDot $pos="top">
          Partner
        </SeatDot>
        <SeatDot $pos="right">Right opp.</SeatDot>
      </SeatDiagram>
      <Label htmlFor="player-name">Your name</Label>
      <NameInput
        id="player-name"
        value={humanName}
        onChange={(e) => setHumanName(formatPlayerNameInput(e.target.value))}
        onBlur={() => setHumanName(sanitizePlayerName(humanName))}
        maxLength={24}
        autoComplete="nickname"
      />
      <Label htmlFor="ai-difficulty">Computer players</Label>
      <DifficultySelect
        id="ai-difficulty"
        value={aiDifficulty}
        onChange={(e) => setAiDifficulty(e.target.value as EuchreAIDifficulty)}
      >
        {EUCHRE_AI_DIFFICULTY_ORDER.map((tier) => (
          <option key={tier} value={tier}>
            {EUCHRE_AI_DIFFICULTY_LABELS[tier]}
          </option>
        ))}
      </DifficultySelect>
      <DifficultyHint>{EUCHRE_AI_DIFFICULTY_HINTS[aiDifficulty]}</DifficultyHint>
      <StartButton type="button" onClick={handleStart}>
        Deal me in
      </StartButton>
    </SelectContainer>
  );
};

export default PlayerSelect;
