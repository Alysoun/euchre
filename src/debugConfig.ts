import type { DebugConfig } from './debug.types';

const DEFAULT_DEBUG: DebugConfig = {
  enabled: false,
  aiTurnDelayMs: null,
  logActions: false,
  autoStart: null,
};

const localModules = import.meta.glob<{ DEBUG: Partial<DebugConfig> }>('./debug.ts', {
  eager: true,
});

function mergeDebug(base: DebugConfig, patch: Partial<DebugConfig>): DebugConfig {
  return {
    ...base,
    ...patch,
    autoStart: patch.autoStart === undefined ? base.autoStart : patch.autoStart,
  };
}

export const DEBUG: DebugConfig = mergeDebug(
  DEFAULT_DEBUG,
  localModules['./debug.ts']?.DEBUG ?? {}
);

export function isDebugActive(): boolean {
  return import.meta.env.DEV && DEBUG.enabled;
}

export function debugAiTurnDelayMs(fallback: number): number {
  if (!isDebugActive() || DEBUG.aiTurnDelayMs == null) return fallback;
  return DEBUG.aiTurnDelayMs;
}

export function debugLogActions(): boolean {
  return isDebugActive() && DEBUG.logActions;
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__EUCHRE_DEBUG__ = DEBUG;
}
