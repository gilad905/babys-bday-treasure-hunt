import { useState, useCallback, useEffect } from 'react';
import type { TreasureHunt, GameState, TreasureLocation } from '../types/hunt';

const STORAGE_PREFIX = 'treasure-hunt-';

function loadState(huntId: string): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + huntId);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_PREFIX + state.huntId, JSON.stringify(state));
}

export function useGameState(hunt: TreasureHunt | null) {
  const [state, setState] = useState<GameState | null>(null);

  // load saved state when a hunt is selected
  useEffect(() => {
    if (!hunt) {
      setState(null);
      return;
    }
    const saved = loadState(hunt.id);
    if (saved) {
      setState(saved);
    }
    // otherwise wait for startGame()
  }, [hunt]);

  const startGame = useCallback(() => {
    if (!hunt) return;
    const initial: GameState = {
      huntId: hunt.id,
      currentLocationIndex: 0,
      foundLocations: [],
      startedAt: Date.now(),
      compassCount: 10,
    };
    saveState(initial);
    setState(initial);
  }, [hunt]);

  const foundLocation = useCallback(() => {
    if (!state || !hunt) return;
    const current = hunt.locations[state.currentLocationIndex];
    if (!current) return;
    const next: GameState = {
      ...state,
      foundLocations: [...state.foundLocations, current.id],
      currentLocationIndex: state.currentLocationIndex + 1,
      completedAt:
        state.currentLocationIndex + 1 >= hunt.locations.length
          ? Date.now()
          : undefined,
      compassCount: state.compassCount ?? 10,
    };
    saveState(next);
    setState(next);
  }, [state, hunt]);
  // decrement compass count and persist
  const decrementCompassCount = useCallback(() => {
    if (!state) return;
    const next: GameState = {
      ...state,
      compassCount: (state.compassCount ?? 10) - 1,
    };
    saveState(next);
    setState(next);
  }, [state]);

  const resetGame = useCallback(() => {
    if (!hunt) return;
    localStorage.removeItem(STORAGE_PREFIX + hunt.id);
    setState(null);
  }, [hunt]);

  const currentLocation: TreasureLocation | null =
    hunt && state && state.currentLocationIndex < hunt.locations.length
      ? hunt.locations[state.currentLocationIndex]
      : null;

  const isGameComplete =
    !!state && !!hunt && state.currentLocationIndex >= hunt.locations.length;

  const progress =
    hunt && state
      ? { current: state.currentLocationIndex, total: hunt.locations.length }
      : null;

  return {
    state,
    currentLocation,
    isGameComplete,
    progress,
    startGame,
    foundLocation,
    resetGame,
    decrementCompassCount,
  };
}
