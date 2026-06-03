/** Optional auto-start from the setup screen (dev only). */
export interface DebugAutoStart {
  enabled: boolean;
  /** Seat indices (0-based) that are human; rest are AI. */
  humanSeats: number[];
}

/**
 * Local dev overrides — edit `src/debug.ts` (gitignored; copy from debug.example.ts).
 * Mutable at runtime via `window.__EUCHRE_DEBUG__` in the browser console.
 */
export interface DebugConfig {
  /** Master switch — overrides only apply when true and `import.meta.env.DEV`. */
  enabled: boolean;
  /** null = no delay between AI turns (trick-complete pause is separate). */
  aiTurnDelayMs: number | null;
  /** Log every dispatch to the console. */
  logActions: boolean;
  autoStart: DebugAutoStart | null;
}

declare global {
  interface Window {
    __EUCHRE_DEBUG__?: DebugConfig;
  }
}

export {};
