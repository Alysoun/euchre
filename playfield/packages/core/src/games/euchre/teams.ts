import type { TeamId } from './types';

export function playerTeam(playerId: number): TeamId {
  return (playerId % 2) as TeamId;
}

export function partnerId(playerId: number): number {
  return (playerId + 2) % 4;
}

export function nextPlayer(from: number): number {
  return (from + 1) % 4;
}

export function trickSizeForState(state: { goAlone: boolean }): number {
  return state.goAlone ? 3 : 4;
}

/** Next seat in turn order, skipping a loner's partner when going alone. */
export function nextActivePlayer(
  from: number,
  state: { goAlone: boolean; lonerId: number | null }
): number {
  if (!state.goAlone || state.lonerId === null) return nextPlayer(from);
  const sitOut = partnerId(state.lonerId);
  let n = nextPlayer(from);
  while (n === sitOut) {
    n = nextPlayer(n);
  }
  return n;
}

export function leftOfDealer(dealerId: number): number {
  return nextPlayer(dealerId);
}

/** Seat to lead the first trick — left of dealer, skipping a lone partner if they would lead. */
export function firstLeader(state: {
  dealerId: number;
  goAlone: boolean;
  lonerId: number | null;
}): number {
  let p = leftOfDealer(state.dealerId);
  if (state.goAlone && state.lonerId !== null) {
    const sitOut = partnerId(state.lonerId);
    while (p === sitOut) {
      p = nextPlayer(p);
    }
  }
  return p;
}

export function nextDealer(dealerId: number): number {
  return nextPlayer(dealerId);
}

export const EuchrePoints = 2;
export const MakerPoints = 1;
export const MarchPoints = 2;
export const LoneMarchPoints = 4;

export type HandOutcomeKind = 'euchre' | 'maker' | 'march' | 'loneMarch';

export function scoreHand(
  makerTeam: TeamId,
  tricksWon: Record<TeamId, number>,
  options?: { goAlone?: boolean }
): { team: TeamId; points: number; description: string; kind: HandOutcomeKind } {
  const makerTricks = tricksWon[makerTeam];
  const defenderTeam = (1 - makerTeam) as TeamId;
  if (makerTricks >= 5) {
    const points = options?.goAlone ? LoneMarchPoints : MarchPoints;
    return {
      team: makerTeam,
      points,
      kind: options?.goAlone ? 'loneMarch' : 'march',
      description: options?.goAlone
        ? `Lone march — ${points} points`
        : `March — ${points} points`,
    };
  }
  if (makerTricks >= 3) {
    return {
      team: makerTeam,
      points: MakerPoints,
      kind: 'maker',
      description: `${makerTricks} tricks — ${MakerPoints} point`,
    };
  }
  return {
    team: defenderTeam,
    points: EuchrePoints,
    kind: 'euchre',
    description: `Euchre! Defenders ${EuchrePoints} points`,
  };
}
