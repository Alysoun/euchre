import { describe, expect, it } from 'vitest';
import { defaultGameLogLayout, maxGameLogWidth } from '../gameLogLayout';
import {
  defaultHandCardBasePx,
  defaultHudHandScaleForViewport,
  defaultSeatLabelScaleForViewport,
  isPhoneViewport,
  isTabletViewport,
} from '../hudPanelLayout';
import { defaultTrickLayoutForViewport } from '../trickLayout';
import { fanContainerSize, scaledFanLayoutSize } from '../../utils/cardFanStack';

describe('viewport layout defaults', () => {
  it('uses smaller hand scale on phone and tablet', () => {
    expect(defaultHudHandScaleForViewport(400)).toBeLessThan(defaultHudHandScaleForViewport(900));
    expect(defaultHudHandScaleForViewport(700)).toBeLessThan(defaultHudHandScaleForViewport(900));
  });

  it('uses smaller card base px on narrow viewports', () => {
    expect(defaultHandCardBasePx(400)).toBe(62);
    expect(defaultHandCardBasePx(700)).toBe(68);
    expect(defaultHandCardBasePx(900)).toBe(72);
  });

  it('places game log top-left on phone', () => {
    const phone = defaultGameLogLayout(390, 844);
    expect(phone.x).toBeLessThanOrEqual(12);
    expect(maxGameLogWidth(false, 390)).toBeGreaterThan(300);
  });

  it('shrinks trick cards on phone', () => {
    const phone = defaultTrickLayoutForViewport(390);
    const desktop = defaultTrickLayoutForViewport(1280);
    expect(phone.cardScale).toBeLessThan(desktop.cardScale);
  });

  it('shrinks seat labels on phone', () => {
    expect(defaultSeatLabelScaleForViewport(390)).toBeLessThan(
      defaultSeatLabelScaleForViewport(1280)
    );
  });

  it('classifies breakpoints', () => {
    expect(isPhoneViewport(480)).toBe(true);
    expect(isPhoneViewport(481)).toBe(false);
    expect(isTabletViewport(768)).toBe(true);
    expect(isTabletViewport(769)).toBe(false);
  });

  it('scales fan container with card base px', () => {
    const desktop = fanContainerSize(5, 72);
    const phone = fanContainerSize(5, 62);
    expect(phone.width).toBeLessThan(desktop.width);
    expect(phone.height).toBeLessThan(desktop.height);
  });

  it('grows layout box when hand scale increases', () => {
    const normal = scaledFanLayoutSize(5, 1, 72);
    const large = scaledFanLayoutSize(5, 1.5, 72);
    expect(large.width).toBeGreaterThan(normal.width);
    expect(large.height).toBeGreaterThan(normal.height);
    expect(large.width).toBe(Math.ceil(normal.baseWidth * 1.5));
    expect(large.height).toBe(Math.ceil(normal.baseHeight * 1.5));
  });
});
