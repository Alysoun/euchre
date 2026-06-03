import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { hasExportableSessionLog } from '@playfield/core/euchre';
import { useGame } from '../context/GameContext';
import { copySessionLogToClipboard, downloadSessionLog } from '../game/sessionLogExport';
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
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  background: #ffd700;
  color: #000;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
`;

const ExportRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

const SecondaryBtn = styled.button`
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.45);
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
`;

const ExportHint = styled.p`
  margin: 12px 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  opacity: 0.78;
`;

const HandSummaryModal: React.FC = () => {
  const { state, dispatch, pause } = useGame();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copySessionLogToClipboard(state);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [state]);

  const handleDownload = useCallback(() => {
    void soundManager.unlock().then(() => {
      soundManager.play('buttonClick');
      downloadSessionLog(state);
    });
  }, [state]);

  const handleDismiss = useCallback(() => {
    void soundManager.unlock().then(() => {
      soundManager.play('buttonClick');
      dispatch({ type: 'DISMISS_HAND_SUMMARY' });
    });
  }, [dispatch]);

  const display = formatHandSummaryDisplay(state);
  if (!display) return null;
  if (state.phase !== 'handSummary' && state.phase !== 'gameOver') return null;
  /** Wait for the final trick to land and collect before covering the table. */
  if (pause.kind !== 'none') return null;

  const canExportLog = state.phase === 'gameOver' && hasExportableSessionLog(state);

  return (
    <Overlay role="dialog" aria-modal="true">
      <Box>
        <Title>{display.title}</Title>
        {display.lines.map((line) => (
          <Line key={line}>{line}</Line>
        ))}
        {canExportLog && (
          <ExportHint>Save your full session log before starting a new game.</ExportHint>
        )}
        <Actions>
          {canExportLog && (
            <ExportRow>
              <SecondaryBtn
                type="button"
                onClick={() => {
                  void soundManager.unlock().then(() => {
                    soundManager.play('buttonClick');
                    void handleCopy();
                  });
                }}
              >
                {copied ? 'Copied' : 'Copy log'}
              </SecondaryBtn>
              <SecondaryBtn type="button" onClick={handleDownload}>
                Save log
              </SecondaryBtn>
            </ExportRow>
          )}
          <Btn type="button" onClick={handleDismiss}>
            {state.phase === 'gameOver' ? 'New game' : 'Next hand'}
          </Btn>
        </Actions>
      </Box>
    </Overlay>
  );
};

export default HandSummaryModal;
