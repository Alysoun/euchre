import { describe, expect, it } from 'vitest';
import { aiTurnDelayMs, dealAnimationDurationMs, paceTimings } from '../gamePace';

describe('gamePace', () => {
  it('normal pace uses readable delays', () => {
    expect(aiTurnDelayMs('normal')).toBeGreaterThanOrEqual(900);
    expect(paceTimings('normal').turnedCardRevealMs).toBeGreaterThan(1000);
    expect(dealAnimationDurationMs('normal')).toBeGreaterThan(1500);
  });

  it('instant pace minimizes waits', () => {
    expect(aiTurnDelayMs('instant')).toBe(0);
    expect(paceTimings('instant').trickCollectMs).toBe(0);
  });
});
