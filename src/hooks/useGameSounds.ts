import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { soundForLogMessage, soundManager } from '../utils/SoundEffects';

export function useGameSounds() {
  const { state } = useGame();
  const lastLogId = useRef<string | null>(null);

  useEffect(() => {
    soundManager.setEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    const entry = state.log[state.log.length - 1];
    if (!entry || entry.id === lastLogId.current) return;
    lastLogId.current = entry.id;
    const sound = soundForLogMessage(entry.message, entry.type);
    if (sound) soundManager.play(sound);
  }, [state.log]);
}
