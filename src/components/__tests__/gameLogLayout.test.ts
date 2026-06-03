import { describe, expect, it } from 'vitest';
import { clampGameLogLayout, maxGameLogHeight } from '../gameLogLayout';
import { clampTrickLayout } from '../trickLayout';

describe('clampGameLogLayout', () => {
  it('preserves expanded height when collapsed', () => {
    const result = clampGameLogLayout({
      x: 12,
      y: 80,
      width: 280,
      height: 200,
      collapsed: true,
    });

    expect(result.collapsed).toBe(true);
    expect(result.height).toBe(200);
    expect(result.width).toBe(280);
  });

  it('restores sensible height after legacy collapse wiped storage to 40px', () => {
    const result = clampGameLogLayout({
      x: 12,
      y: 80,
      width: 240,
      height: 40,
      collapsed: false,
    });

    expect(result.height).toBeGreaterThanOrEqual(72);
  });

  it('keeps user-resized log dimensions outside layout edit mode', () => {
    const layout = {
      x: 8,
      y: 72,
      width: 358,
      height: 724,
      collapsed: false,
    };
    const clamped = clampGameLogLayout(layout, false);
    expect(clamped.width).toBe(358);
    expect(clamped.height).toBe(Math.min(724, maxGameLogHeight(false)));
    expect(clamped.height).toBeGreaterThan(280);
  });
});

describe('clampTrickLayout', () => {
  it('defaults facePlayer when missing from storage', () => {
    const result = clampTrickLayout({
      offsetX: 0,
      offsetY: 12,
      spread: 1.1,
      cardScale: 1.1,
    });
    expect(result.facePlayer).toBe(100);
  });

  it('migrates legacy negative tiltAdjust to readable facePlayer', () => {
    const result = clampTrickLayout({
      offsetX: 0,
      offsetY: 12,
      spread: 1,
      cardScale: 1,
      tiltAdjust: -34,
    } as Parameters<typeof clampTrickLayout>[0]);
    expect(result.facePlayer).toBeGreaterThanOrEqual(0);
    expect(result.facePlayer).toBeLessThanOrEqual(100);
  });
});
