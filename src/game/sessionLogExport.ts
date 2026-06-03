import type { GameState } from '@playfield/core/euchre';
import {
  sessionLogEntries,
  SESSION_LOG_MAX_BYTES,
  sessionLogByteSize,
} from '@playfield/core/euchre';
import { GAME_NAME } from './branding';

function formatTimestamp(ms: number | undefined): string {
  if (!ms) return new Date().toISOString();
  return new Date(ms).toISOString();
}

function teamLabel(team: 0 | 1): string {
  return team === 0 ? 'You & partner' : 'Opponents';
}

export function formatSessionLogText(state: GameState): string {
  const lines: string[] = [
    `${GAME_NAME} — full session log`,
    `Started: ${formatTimestamp(state.sessionStartedAt)}`,
    `Exported: ${new Date().toISOString()}`,
    `Players: ${state.players.map((p) => `${p.name} (team ${p.team})`).join(', ')}`,
    `AI difficulty: ${state.aiDifficulty}`,
    `Score: ${teamLabel(0)} ${state.score[0]} — ${teamLabel(1)} ${state.score[1]}`,
    `Hand: ${state.roundNumber}`,
    `Phase: ${state.phase}`,
  ];

  const entries = sessionLogEntries(state);
  const logBytes = sessionLogByteSize(entries);
  if ((state.sessionLogDroppedCount ?? 0) > 0) {
    lines.push(
      `Session log: ${entries.length} lines (${Math.round(logBytes / 1024)}KB) — ${state.sessionLogDroppedCount} older line(s) dropped at ${SESSION_LOG_MAX_BYTES / 1024}KB cap`
    );
  } else {
    lines.push(`Session log: ${entries.length} lines (${Math.round(logBytes / 1024)}KB)`);
  }

  lines.push('---');

  for (const entry of entries) {
    const tag =
      entry.type === 'error' ? '[!]' : entry.type === 'success' ? '[+]' : '   ';
    lines.push(`${tag} ${entry.message}`);
  }

  lines.push('---', `Final score: ${teamLabel(0)} ${state.score[0]} — ${teamLabel(1)} ${state.score[1]}`);

  return lines.join('\n');
}

export function downloadSessionLog(state: GameState): void {
  const text = formatSessionLogText(state);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  anchor.href = url;
  anchor.download = `euchre-session-${stamp}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function copySessionLogToClipboard(state: GameState): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(formatSessionLogText(state));
    return true;
  } catch {
    return false;
  }
}
