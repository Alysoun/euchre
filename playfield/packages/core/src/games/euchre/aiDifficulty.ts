/** Computer player skill for the whole table (all non-human seats). */
export type EuchreAIDifficulty = 'easy' | 'medium' | 'hard';

export const EUCHRE_AI_DIFFICULTY_ORDER: EuchreAIDifficulty[] = ['easy', 'medium', 'hard'];

export const EUCHRE_AI_DIFFICULTY_LABELS: Record<EuchreAIDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const EUCHRE_AI_DIFFICULTY_HINTS: Record<EuchreAIDifficulty, string> = {
  easy: 'Forgiving bids and occasional loose plays — good for learning',
  medium: 'Solid club-style play without going alone much',
  hard: 'Tighter bids, fixed-seat trick play, and rare lone attempts',
};

export const DEFAULT_EUCHRE_AI_DIFFICULTY: EuchreAIDifficulty = 'easy';

export function normalizeEuchreAIDifficulty(
  value: unknown
): EuchreAIDifficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  return DEFAULT_EUCHRE_AI_DIFFICULTY;
}
