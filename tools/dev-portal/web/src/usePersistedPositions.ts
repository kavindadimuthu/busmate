import { useCallback, useState } from 'react';

const KEY = 'busmate-devportal-positions-v1';

export type PosMap = Record<string, { x: number; y: number }>;

function load(): PosMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Custom node positions, persisted to localStorage so a drag survives reloads.
 * `reset()` clears every override so nodes fall back to the layout in the registry.
 */
export function usePersistedPositions() {
  const [positions, setPositions] = useState<PosMap>(load);

  const savePosition = useCallback((id: string, pos: { x: number; y: number }) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: pos };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setPositions({});
  }, []);

  const hasOverrides = Object.keys(positions).length > 0;

  return { positions, savePosition, reset, hasOverrides };
}
