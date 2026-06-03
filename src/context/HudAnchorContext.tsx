import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

type HudAnchorRects = {
  score: DOMRect | null;
  log: DOMRect | null;
  hud: DOMRect | null;
};

type HudAnchorContextValue = {
  registerAnchor: (id: keyof HudAnchorRects, el: HTMLElement | null) => void;
  getAnchorRects: () => HudAnchorRects;
};

const HudAnchorContext = createContext<HudAnchorContextValue | null>(null);

export const HudAnchorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scoreRef = useRef<HTMLElement | null>(null);
  const logRef = useRef<HTMLElement | null>(null);
  const hudRef = useRef<HTMLElement | null>(null);

  const registerAnchor = useCallback((id: keyof HudAnchorRects, el: HTMLElement | null) => {
    if (id === 'score') scoreRef.current = el;
    else if (id === 'log') logRef.current = el;
    else hudRef.current = el;
  }, []);

  const getAnchorRects = useCallback((): HudAnchorRects => {
    return {
      score: scoreRef.current?.getBoundingClientRect() ?? null,
      log: logRef.current?.getBoundingClientRect() ?? null,
      hud: hudRef.current?.getBoundingClientRect() ?? null,
    };
  }, []);

  const value = useMemo(
    () => ({ registerAnchor, getAnchorRects }),
    [registerAnchor, getAnchorRects]
  );

  return <HudAnchorContext.Provider value={value}>{children}</HudAnchorContext.Provider>;
};

export function useHudAnchors(): HudAnchorContextValue {
  const ctx = useContext(HudAnchorContext);
  if (!ctx) {
    throw new Error('useHudAnchors must be used within HudAnchorProvider');
  }
  return ctx;
}

export function useHudAnchorRef(id: keyof HudAnchorRects) {
  const { registerAnchor } = useHudAnchors();
  return useCallback(
    (el: HTMLElement | null) => {
      registerAnchor(id, el);
    },
    [id, registerAnchor]
  );
}
