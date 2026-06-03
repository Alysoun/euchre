import {
  clampGameLogLayout,
  clearLegacyGameLogLayout,
  defaultGameLogLayout,
  GameLogLayout,
  loadLegacyGameLogLayout,
} from './gameLogLayout';
import type { TrickLayout } from './trickLayout';
import { clampTrickLayout, defaultTrickLayout, defaultTrickLayoutForViewport } from './trickLayout';
import type { TrumpPillLayout } from './trumpPillLayout';
import { clampTrumpPillLayout, defaultTrumpPillLayout } from './trumpPillLayout';

export type { GameLogLayout } from './gameLogLayout';
export {
  clampGameLogLayout,
  defaultGameLogLayout,
  gameLogDragBounds,
  maxGameLogHeight,
  maxGameLogWidth,
  minGameLogHeight,
  prepareGameLogForEditing,
} from './gameLogLayout';

export type { TrickLayout } from './trickLayout';
export {
  BASE_TRICK_CARD_PX,
  clampTrickLayout,
  defaultTrickLayout,
  defaultTrickLayoutForViewport,
  MAX_TRICK_CARD_SCALE,
  MAX_TRICK_OFFSET_X,
  MAX_TRICK_OFFSET_Y,
  MAX_TRICK_SPREAD,
  MIN_TRICK_CARD_SCALE,
  MIN_TRICK_OFFSET_X,
  MIN_TRICK_OFFSET_Y,
  MIN_TRICK_SPREAD,
  MIN_TRICK_FACE_PLAYER,
  MAX_TRICK_FACE_PLAYER,
  TRICK_CENTER_TOP_PCT,
  trickFanOffset,
} from './trickLayout';

export type { TrumpPillLayout } from './trumpPillLayout';
export {
  clampTrumpPillLayout,
  defaultTrumpPillLayout,
  MAX_TRUMP_PILL_SCALE,
  MIN_TRUMP_PILL_SCALE,
} from './trumpPillLayout';

export type LayoutEditGroup = 'log' | 'opponents' | 'trick' | 'hud' | 'trump';

export const LAYOUT_EDIT_GROUP_ORDER: LayoutEditGroup[] = [
  'log',
  'opponents',
  'trick',
  'trump',
  'hud',
];

export const LAYOUT_EDIT_GROUP_LABELS: Record<LayoutEditGroup, string> = {
  log: 'Game log',
  opponents: 'Opponent labels',
  trick: 'Trick cards',
  trump: 'Trump pill',
  hud: 'Your hand panel',
};

export const LAYOUT_EDIT_GROUP_HINTS: Record<LayoutEditGroup, string> = {
  log: 'Drag the game log by its header. Use the sliders below to resize.',
  opponents: 'Drag opponent name labels within the blue box at each seat.',
  trick: 'Adjust trick position, spread, size, and how much cards face toward you.',
  trump: 'Drag the trump pill (⠿ or whole pill in this tab). Release near score, log, or hand to snap. Resize below.',
  hud: 'Drag your hand panel to reposition it. Use the slider below to resize your cards.',
};

export const DEFAULT_LAYOUT_EDIT_GROUP: LayoutEditGroup = 'log';

export const MAX_HUD_DOCK_OFFSET_PX = 160;
export const MAX_HUD_DOCK_OFFSET_EDIT_PX = 340;

export const MIN_HUD_HAND_SCALE = 0.72;
export const MAX_HUD_HAND_SCALE = 1.5;
export const DEFAULT_HUD_HAND_SCALE = 1;
export const DEFAULT_HUD_HAND_SCALE_TABLET = 0.88;
export const DEFAULT_HUD_HAND_SCALE_PHONE = 0.78;

export const BREAKPOINT_PHONE = 480;
export const BREAKPOINT_TABLET = 768;

export function isPhoneViewport(width = viewportWidth()): boolean {
  return width <= BREAKPOINT_PHONE;
}

export function isTabletViewport(width = viewportWidth()): boolean {
  return width <= BREAKPOINT_TABLET;
}

export function defaultHudHandScaleForViewport(width = viewportWidth()): number {
  if (width <= BREAKPOINT_PHONE) return DEFAULT_HUD_HAND_SCALE_PHONE;
  if (width <= BREAKPOINT_TABLET) return DEFAULT_HUD_HAND_SCALE_TABLET;
  return DEFAULT_HUD_HAND_SCALE;
}

/** Base card width (px) before HUD hand scale transform. */
export function defaultHandCardBasePx(width = viewportWidth()): number {
  if (width <= BREAKPOINT_PHONE) return 62;
  if (width <= BREAKPOINT_TABLET) return 68;
  return 72;
}

export function clampHudHandScale(scale: number): number {
  return Math.min(MAX_HUD_HAND_SCALE, Math.max(MIN_HUD_HAND_SCALE, scale));
}

export function hudDragBounds(editMode = false): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const max = editMode ? MAX_HUD_DOCK_OFFSET_EDIT_PX : MAX_HUD_DOCK_OFFSET_PX;
  return { left: -max, top: -max, right: max, bottom: max };
}

export type HudDockOffset = { dx: number; dy: number };

export type SeatLabelOffset = { dx: number; dy: number };
export type SeatLabelOffsets = Record<number, SeatLabelOffset>;

export function clampHudDockOffset(dx: number, dy: number): HudDockOffset {
  const max = MAX_HUD_DOCK_OFFSET_EDIT_PX;
  const dist = Math.hypot(dx, dy);
  if (dist <= max || dist === 0) return { dx, dy };
  const scale = max / dist;
  return { dx: dx * scale, dy: dy * scale };
}

export function defaultHudDockOffset(): HudDockOffset {
  return { dx: 0, dy: 0 };
}

export type StoredHudLayout = {
  gameLog: GameLogLayout;
  seatLabelScale: number;
  seatLabelOffsets: SeatLabelOffsets;
  hudDockOffset: HudDockOffset;
  hudHandScale: number;
  trickLayout: TrickLayout;
  trumpPill: TrumpPillLayout;
};

export const DEFAULT_SEAT_LABEL_SCALE = 1.45;
export const DEFAULT_SEAT_LABEL_SCALE_TABLET = 1.25;
export const DEFAULT_SEAT_LABEL_SCALE_PHONE = 1.05;
export const MIN_SEAT_LABEL_SCALE = 1;
export const MAX_SEAT_LABEL_SCALE = 2.5;
export const MAX_SEAT_LABEL_OFFSET_PX = 80;
export const MAX_SEAT_INDEX = 3;

export const MIN_GAME_LOG_WIDTH = 140;
export const MAX_GAME_LOG_WIDTH = 520;
export const MIN_GAME_LOG_HEIGHT = 72;
export const MAX_GAME_LOG_HEIGHT_DESKTOP = 280;

/** Stacking order — layout banner must stay above draggable panels (seat labels, log, HUD). */
export const Z_LEAVE_TABLE = 99999;
export const Z_TABLE_CONTROLS = 99998;
export const Z_LAYOUT_EDIT_BANNER = 99990;
export const Z_LAYOUT_EDIT_BACKDROP = 99985;
export const Z_LAYOUT_EDIT_TARGET = 99950;
export const Z_PLAYER_HUD = 140;
export const Z_SEAT_LABEL = 56;
export const Z_SEAT_LABEL_DIMMED = 52;

const STORAGE_KEY = 'euchre-hud-layout';
const LEGACY_STORAGE_KEY = 'tripoley-hud-layout';

export function viewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1280;
}

export function viewportHeight(): number {
  return typeof window !== 'undefined' ? window.innerHeight : 800;
}

export function layoutEditLogTopInset(): number {
  return 56;
}

export function layoutEditBottomInset(): number {
  return 12;
}

export function hudSafeAreaBottom(): number {
  const w = viewportWidth();
  const h = viewportHeight();
  if (w <= 480) return 48;
  if (w <= 768 || h <= 620) return 40;
  return 32;
}

export function defaultSeatLabelOffsets(): SeatLabelOffsets {
  return Object.fromEntries(
    Array.from({ length: MAX_SEAT_INDEX + 1 }, (_, seatIndex) => [seatIndex, { dx: 0, dy: 0 }])
  ) as SeatLabelOffsets;
}

export function clampSeatLabelScale(scale: number): number {
  return Math.min(MAX_SEAT_LABEL_SCALE, Math.max(MIN_SEAT_LABEL_SCALE, scale));
}

export function clampSeatLabelOffset(dx: number, dy: number): SeatLabelOffset {
  const dist = Math.hypot(dx, dy);
  if (dist <= MAX_SEAT_LABEL_OFFSET_PX || dist === 0) return { dx, dy };
  const scale = MAX_SEAT_LABEL_OFFSET_PX / dist;
  return { dx: dx * scale, dy: dy * scale };
}

export function defaultSeatLabelScaleForViewport(width = viewportWidth()): number {
  if (width <= 480) return DEFAULT_SEAT_LABEL_SCALE_PHONE;
  if (width <= 768) return DEFAULT_SEAT_LABEL_SCALE_TABLET;
  return DEFAULT_SEAT_LABEL_SCALE;
}

export function defaultStoredHudLayout(): StoredHudLayout {
  return {
    gameLog: defaultGameLogLayout(),
    seatLabelScale: defaultSeatLabelScaleForViewport(),
    seatLabelOffsets: defaultSeatLabelOffsets(),
    hudDockOffset: defaultHudDockOffset(),
    hudHandScale: defaultHudHandScaleForViewport(),
    trickLayout: defaultTrickLayout(),
    trumpPill: defaultTrumpPillLayout(),
  };
}

export function clampStoredHudLayout(
  stored: StoredHudLayout,
  layoutEditMode: boolean,
  layoutEditGroup: LayoutEditGroup
): StoredHudLayout {
  return {
    ...stored,
    gameLog: clampGameLogLayout(
      stored.gameLog,
      layoutEditMode && layoutEditGroup === 'log'
    ),
    seatLabelScale: clampSeatLabelScale(stored.seatLabelScale),
    seatLabelOffsets: stored.seatLabelOffsets,
    hudDockOffset: clampHudDockOffset(stored.hudDockOffset.dx, stored.hudDockOffset.dy),
    hudHandScale: clampHudHandScale(stored.hudHandScale),
    trickLayout: clampTrickLayout(stored.trickLayout),
    trumpPill: clampTrumpPillLayout(stored.trumpPill),
  };
}

export function loadStoredHudLayout(): StoredHudLayout {
  try {
    for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<StoredHudLayout> & {
        gameLog?: Partial<GameLogLayout>;
      };

      const gameLog =
        parsed.gameLog && typeof parsed.gameLog === 'object'
          ? clampGameLogLayout({ ...defaultGameLogLayout(), ...parsed.gameLog })
          : loadLegacyGameLogLayout() ?? defaultGameLogLayout();

      if (!parsed.gameLog && loadLegacyGameLogLayout()) {
        clearLegacyGameLogLayout();
      }

      const rawHud = parsed.hudDockOffset;
      const hudDockOffset =
        rawHud && typeof rawHud.dx === 'number' && typeof rawHud.dy === 'number'
          ? clampHudDockOffset(rawHud.dx, rawHud.dy)
          : defaultHudDockOffset();

      return {
        gameLog,
        seatLabelScale: clampSeatLabelScale(
          typeof parsed.seatLabelScale === 'number'
            ? parsed.seatLabelScale
            : defaultSeatLabelScaleForViewport()
        ),
        seatLabelOffsets: {
          ...defaultSeatLabelOffsets(),
          ...(parsed.seatLabelOffsets ?? {}),
        },
        hudDockOffset,
        hudHandScale: clampHudHandScale(
          typeof parsed.hudHandScale === 'number'
            ? parsed.hudHandScale
            : defaultHudHandScaleForViewport()
        ),
        trickLayout: clampTrickLayout(parsed.trickLayout ?? defaultTrickLayout()),
        trumpPill: clampTrumpPillLayout(parsed.trumpPill ?? defaultTrumpPillLayout()),
      };
    }
    return defaultStoredHudLayout();
  } catch {
    return defaultStoredHudLayout();
  }
}

export function saveStoredHudLayout(stored: StoredHudLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function clearStoredHudLayout(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
