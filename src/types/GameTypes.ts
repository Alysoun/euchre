/**
 * Euchre app types — re-exported from @playfield/core/euchre so UI and engine cannot drift.
 */
export type {
  Suit,
  EuchreRank as Rank,
  Card,
  TeamId,
  Player,
  GamePhase,
  BidAction,
  TrickPlay,
  GameLogEntry,
  GameState,
  GameAction,
  SeatConfig,
  HandSummary,
  HandOutcomeKind,
  EuchreAIDifficulty,
} from '@playfield/core/euchre';
