import type { TeamId } from './types';

export function teamLabel(team: TeamId): string {
  return team === 0 ? 'You & partner' : 'Opponents';
}
