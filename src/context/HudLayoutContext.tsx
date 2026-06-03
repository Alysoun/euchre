import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearStoredHudLayout,
  clampGameLogLayout,
  clampHudDockOffset,
  clampHudHandScale,
  clampSeatLabelOffset,
  clampSeatLabelScale,
  defaultGameLogLayout,
  defaultSeatLabelOffsets,
  clampTrickLayout,
  clampTrumpPillLayout,
  defaultStoredHudLayout,
  GameLogLayout,
  HudDockOffset,
  LayoutEditGroup,
  loadStoredHudLayout,
  prepareGameLogForEditing,
  saveStoredHudLayout,
  SeatLabelOffset,
  SeatLabelOffsets,
  TrickLayout,
  TrumpPillLayout,
} from '../components/hudPanelLayout';

type HudLayoutContextValue = {
  gameLogLayout: GameLogLayout;
  seatLabelScale: number;
  seatLabelOffsets: SeatLabelOffsets;
  hudDockOffset: HudDockOffset;
  hudHandScale: number;
  trickLayout: TrickLayout;
  trumpPillLayout: TrumpPillLayout;
  layoutEditMode: boolean;
  layoutEditGroup: LayoutEditGroup;
  setLayoutEditMode: (enabled: boolean) => void;
  setLayoutEditGroup: (group: LayoutEditGroup) => void;
  isEditingLayoutGroup: (group: LayoutEditGroup) => boolean;
  toggleLayoutEditMode: () => void;
  setGameLogLayout: (patch: Partial<GameLogLayout>) => void;
  setSeatLabelScale: (scale: number) => void;
  setSeatLabelOffset: (seatIndex: number, offset: SeatLabelOffset) => void;
  setHudDockOffset: (offset: HudDockOffset) => void;
  setHudHandScale: (scale: number) => void;
  setTrickLayout: (patch: Partial<TrickLayout>) => void;
  setTrumpPillLayout: (patch: Partial<TrumpPillLayout>) => void;
  resetLayout: () => void;
};

const HudLayoutContext = createContext<HudLayoutContextValue | null>(null);

export const HudLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stored, setStored] = useState(loadStoredHudLayout);
  const [layoutEditMode, setLayoutEditModeState] = useState(false);
  const [layoutEditGroup, setLayoutEditGroup] = useState<LayoutEditGroup>('log');

  useEffect(() => {
    saveStoredHudLayout(stored);
  }, [stored]);

  const isEditingLayoutGroup = useCallback(
    (group: LayoutEditGroup) => layoutEditMode && layoutEditGroup === group,
    [layoutEditMode, layoutEditGroup]
  );

  const setLayoutEditGroupWithPrep = useCallback((group: LayoutEditGroup) => {
    setLayoutEditGroup(group);
    if (group === 'log') {
      setStored((prev) => ({
        ...prev,
        gameLog: prepareGameLogForEditing(prev.gameLog),
      }));
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      setStored((prev) => ({
        ...prev,
        gameLog: clampGameLogLayout(
          prev.gameLog,
          layoutEditMode && layoutEditGroup === 'log'
        ),
      }));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [layoutEditMode, layoutEditGroup]);

  const setGameLogLayout = useCallback(
    (patch: Partial<GameLogLayout>) => {
      setStored((prev) => ({
        ...prev,
        gameLog: clampGameLogLayout(
          { ...prev.gameLog, ...patch },
          layoutEditMode && layoutEditGroup === 'log'
        ),
      }));
    },
    [layoutEditMode, layoutEditGroup]
  );

  const setSeatLabelOffset = useCallback((seatIndex: number, offset: SeatLabelOffset) => {
    setStored((prev) => ({
      ...prev,
      seatLabelOffsets: {
        ...(prev.seatLabelOffsets ?? defaultSeatLabelOffsets()),
        [seatIndex]: clampSeatLabelOffset(offset.dx, offset.dy),
      },
    }));
  }, []);

  const setSeatLabelScale = useCallback((scale: number) => {
    setStored((prev) => ({
      ...prev,
      seatLabelScale: clampSeatLabelScale(scale),
    }));
  }, []);

  const setHudDockOffset = useCallback((offset: HudDockOffset) => {
    setStored((prev) => ({
      ...prev,
      hudDockOffset: clampHudDockOffset(offset.dx, offset.dy),
    }));
  }, []);

  const setHudHandScale = useCallback((scale: number) => {
    setStored((prev) => ({
      ...prev,
      hudHandScale: clampHudHandScale(scale),
    }));
  }, []);

  const setTrickLayout = useCallback((patch: Partial<TrickLayout>) => {
    setStored((prev) => ({
      ...prev,
      trickLayout: clampTrickLayout({ ...prev.trickLayout, ...patch }),
    }));
  }, []);

  const setTrumpPillLayout = useCallback((patch: Partial<TrumpPillLayout>) => {
    setStored((prev) => ({
      ...prev,
      trumpPill: clampTrumpPillLayout({ ...prev.trumpPill, ...patch }),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    clearStoredHudLayout();
    setStored(defaultStoredHudLayout());
  }, []);

  const toggleLayoutEditMode = useCallback(() => {
    setLayoutEditModeState((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      gameLogLayout: stored.gameLog,
      seatLabelScale: stored.seatLabelScale,
      seatLabelOffsets: stored.seatLabelOffsets,
      hudDockOffset: stored.hudDockOffset,
      hudHandScale: stored.hudHandScale,
      trickLayout: stored.trickLayout,
      trumpPillLayout: stored.trumpPill,
      layoutEditMode,
      layoutEditGroup,
      setLayoutEditMode: setLayoutEditModeState,
      setLayoutEditGroup: setLayoutEditGroupWithPrep,
      isEditingLayoutGroup,
      toggleLayoutEditMode,
      setGameLogLayout,
      setSeatLabelScale,
      setSeatLabelOffset,
      setHudDockOffset,
      setHudHandScale,
      setTrickLayout,
      setTrumpPillLayout,
      resetLayout,
    }),
    [
      stored,
      layoutEditMode,
      layoutEditGroup,
      isEditingLayoutGroup,
      setLayoutEditGroupWithPrep,
      toggleLayoutEditMode,
      setGameLogLayout,
      setSeatLabelScale,
      setSeatLabelOffset,
      setHudDockOffset,
      setHudHandScale,
      setTrickLayout,
      setTrumpPillLayout,
      resetLayout,
    ]
  );

  return <HudLayoutContext.Provider value={value}>{children}</HudLayoutContext.Provider>;
};

export function useHudLayout(): HudLayoutContextValue {
  const ctx = useContext(HudLayoutContext);
  if (!ctx) {
    throw new Error('useHudLayout must be used within HudLayoutProvider');
  }
  return ctx;
};
