import type { Suit } from '../../types/cards';
import type { EuchreAIDifficulty } from './aiDifficulty';
import type { HandOutcomeKind } from './teams';

export type { EuchreAIDifficulty } from './aiDifficulty';

export type { Suit } from '../../types/cards';

/** Euchre uses a 24-card deck (9 through ace). */
export type EuchreRank = '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  value: EuchreRank;
  id: string;
}

export type TeamId = 0 | 1;

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  cards: Card[];
  team: TeamId;
}

export type GamePhase =
  | 'setup'
  | 'bidding'
  | 'biddingRound2'
  | 'dealerDiscard'
  | 'playing'
  | 'handSummary'
  | 'gameOver';

export type BidAction = 'pass' | 'orderUp' | 'nameTrump';

export interface TrickPlay {
  playerId: number;
  card: Card;
}

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface GameState {
  players: Player[];
  dealerId: number;
  currentPlayer: number;
  phase: GamePhase;
  trump: Suit | null;
  turnedCard: Card | null;
  biddingRound: 1 | 2;
  passesThisRound: number;
  makerTeam: TeamId | null;
  trumpCallerId: number | null;
  /** How trump was made this hand (for UI). */
  trumpCallKind: 'orderUp' | 'nameTrump' | null;
  /** Maker plays alone; partner sits out (3-card tricks). */
  goAlone: boolean;
  lonerId: number | null;
  currentTrick: TrickPlay[];
  leadSuit: Suit | null;
  tricksWon: Record<TeamId, number>;
  score: Record<TeamId, number>;
  roundNumber: number;
  log: GameLogEntry[];
  soundEnabled: boolean;
  isSoloSession: boolean;
  /** Skill level for all computer players at the table. */
  aiDifficulty: EuchreAIDifficulty;
  handSummary: HandSummary | null;
}

export interface HandSummary {
  title: string;
  lines: string[];
  outcome: {
    scoringTeam: TeamId;
    points: number;
    kind: HandOutcomeKind;
    makerTeam: TeamId;
  };
  tricksWon: Record<TeamId, number>;
  score: Record<TeamId, number>;
  winningTeam?: TeamId;
}

export type GameAction =
  | { type: 'START_GAME'; seats: SeatConfig[]; aiDifficulty?: EuchreAIDifficulty }
  | { type: 'QUIT_GAME' }
  | { type: 'BID'; action: BidAction; suit?: Suit; goAlone?: boolean }
  | { type: 'DEALER_DISCARD'; card: Card }
  | { type: 'PLAY_CARD'; card: Card }
  | { type: 'REORDER_CARDS'; playerId: number; cards: Card[] }
  | { type: 'DISMISS_HAND_SUMMARY' }
  | { type: 'TOGGLE_SOUND' };

export interface SeatConfig {
  isHuman: boolean;
  name?: string;
}
