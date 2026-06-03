import {
  DEFAULT_EUCHRE_AI_DIFFICULTY,
  normalizeEuchreAIDifficulty,
  type EuchreAIDifficulty,
} from '@playfield/core/euchre';

const STORAGE_KEY = 'euchre-ai-difficulty';

export function loadStoredAiDifficulty(): EuchreAIDifficulty {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeEuchreAIDifficulty(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_EUCHRE_AI_DIFFICULTY;
}

export function saveStoredAiDifficulty(difficulty: EuchreAIDifficulty): void {
  try {
    localStorage.setItem(STORAGE_KEY, difficulty);
  } catch {
    /* ignore */
  }
}
