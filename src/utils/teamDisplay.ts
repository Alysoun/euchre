import { partnerId } from '@playfield/core/euchre';
import type { GameState, HandSummary, Player, TeamId } from '../types/GameTypes';

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name;
}

export function humanPlayer(state: Pick<GameState, 'players'>): Player | null {
  return state.players.find((p) => p.isHuman) ?? null;
}

export function humanTeamId(state: Pick<GameState, 'players'>): TeamId {
  const human = humanPlayer(state);
  return human?.team ?? 0;
}

export function opponentTeamId(state: Pick<GameState, 'players'>): TeamId {
  return (1 - humanTeamId(state)) as TeamId;
}

export function partnerPlayer(state: Pick<GameState, 'players'>): Player | null {
  const human = humanPlayer(state);
  if (!human) return null;
  return state.players[partnerId(human.id)] ?? null;
}

export function teamPlayers(state: Pick<GameState, 'players'>, team: TeamId): Player[] {
  return state.players.filter((p) => p.team === team);
}

/** e.g. "Mike (you) & Mickie" or "Elaine & Bronx" */
export function allianceLabel(state: Pick<GameState, 'players'>, team: TeamId): string {
  const [a, b] = teamPlayers(state, team);
  if (!a || !b) return team === humanTeamId(state) ? 'Your side' : 'Their side';

  const formatOne = (p: Player) => (p.isHuman ? `${firstName(p.name)} (you)` : firstName(p.name));

  if (a.isHuman) return `${formatOne(a)} & ${formatOne(b)}`;
  if (b.isHuman) return `${formatOne(b)} & ${formatOne(a)}`;
  return `${firstName(a.name)} & ${firstName(b.name)}`;
}

/** Shorter scoreboard header — "Mike · Mickie" */
export function allianceScoreboardLabel(
  state: Pick<GameState, 'players'>,
  team: TeamId
): string {
  const [a, b] = teamPlayers(state, team);
  if (!a || !b) return team === humanTeamId(state) ? 'You' : 'Them';
  const formatOne = (p: Player) => (p.isHuman ? `${firstName(p.name)} (you)` : firstName(p.name));
  if (a.isHuman || b.isHuman) {
    const you = a.isHuman ? a : b;
    const mate = a.isHuman ? b : a;
    return `${formatOne(you)} · ${formatOne(mate)}`;
  }
  return `${firstName(a.name)} · ${firstName(b.name)}`;
}

function isStructuredSummary(
  summary: GameState['handSummary']
): summary is HandSummary & { outcome: HandSummary['outcome'] } {
  return Boolean(summary && 'outcome' in summary && summary.outcome);
}

function handSummaryTitle(
  state: Pick<GameState, 'players'>,
  summary: HandSummary,
  humanWonHand: boolean
): string {
  const { kind } = summary.outcome;
  if (summary.winningTeam !== undefined) {
    return humanWonHand ? 'Table conquered!' : 'Tough break at the table';
  }
  if (kind === 'euchre') return humanWonHand ? "Got 'em!" : 'Euchred!';
  if (kind === 'loneMarch') return humanWonHand ? 'Lone wolf howls!' : 'Solo takedown';
  if (kind === 'march') return humanWonHand ? 'Clean sweep!' : 'They ran the table';
  return humanWonHand ? 'Hand yours' : 'Their hand';
}

function handSummaryHeadline(
  state: Pick<GameState, 'players'>,
  summary: HandSummary
): string {
  const us = humanTeamId(state);
  const { outcome } = summary;
  const scorers = allianceLabel(state, outcome.scoringTeam);
  const makers = allianceLabel(state, outcome.makerTeam);
  const weScored = outcome.scoringTeam === us;
  const pts = outcome.points;

  switch (outcome.kind) {
    case 'euchre':
      return weScored
        ? `${scorers} bag the euchre (+${pts})`
        : `${makers} get euchred — ${scorers} cash in (+${pts})`;
    case 'loneMarch':
      return `${scorers} lone march — all ${pts} points!`;
    case 'march':
      return `${scorers} march the hand (+${pts})`;
    case 'maker':
    default:
      return `${scorers} take the hand (+${pts})`;
  }
}

function handSummaryFlavor(
  state: Pick<GameState, 'players'>,
  summary: HandSummary
): string | null {
  const us = humanTeamId(state);
  const { outcome } = summary;
  const weScored = outcome.scoringTeam === us;
  const usTricks = summary.tricksWon[us];
  const themTricks = summary.tricksWon[opponentTeamId(state)];

  if (outcome.kind === 'euchre') {
    return weScored
      ? 'They ordered trump and came up short.'
      : 'Rough one — they stole the hand from under you.';
  }
  if (outcome.kind === 'loneMarch') {
    return weScored ? 'Every trick — no mercy.' : 'Went alone and ran the table.';
  }
  if (outcome.kind === 'march' && usTricks >= 5) {
    return 'All five tricks — textbook march.';
  }
  if (usTricks === themTricks) return null;
  if (weScored && themTricks <= 1) return 'Barely left them a scrap.';
  if (!weScored && usTricks <= 1) return 'Only a trick or two to show for it.';
  return null;
}

export type HandSummaryDisplay = {
  title: string;
  lines: string[];
};

export function formatHandSummaryDisplay(state: GameState): HandSummaryDisplay | null {
  const summary = state.handSummary;
  if (!summary) return null;

  if (!isStructuredSummary(summary)) {
    const us = allianceLabel(state, humanTeamId(state));
    const them = allianceLabel(state, opponentTeamId(state));
    return {
      title: summary.title,
      lines: summary.lines.map((line) =>
        line.replaceAll('You & partner', us).replaceAll('Opponents', them)
      ),
    };
  }

  const us = humanTeamId(state);
  const them = opponentTeamId(state);
  const usName = allianceLabel(state, us);
  const themName = allianceLabel(state, them);
  const humanWonHand = summary.outcome.scoringTeam === us;

  const lines: string[] = [
    handSummaryHeadline(state, summary),
    `${usName}: ${summary.tricksWon[us]} tricks · ${themName}: ${summary.tricksWon[them]} tricks`,
    `Scoreboard — ${usName} ${summary.score[us]}, ${themName} ${summary.score[them]}`,
  ];

  const flavor = handSummaryFlavor(state, summary);
  if (flavor) lines.splice(1, 0, flavor);

  if (summary.winningTeam !== undefined) {
    const champs = allianceLabel(state, summary.winningTeam);
    lines.push(
      summary.winningTeam === us
        ? `${champs} win the game — nice shooting!`
        : `${champs} win the game. Shuffle up for another?`
    );
  }

  return {
    title: handSummaryTitle(state, summary, humanWonHand),
    lines,
  };
}
