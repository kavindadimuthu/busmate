"use client";

import * as React from "react";
import {
  THEMES,
  DEFAULT_PERSONALITY,
  PERSONALITY_STORAGE_KEY,
  type ThemeConfig,
  type ThemePersonality,
} from "./theme-registry";

/* ── Context ────────────────────────────────────────────── */

interface ThemePersonalityContextValue {
  /** The active color personality id (matches data-theme on <html>). */
  personality: ThemePersonality;
  /** Switch to a different color personality. Persisted in localStorage. */
  setPersonality: (theme: ThemePersonality) => void;
  /** All registered themes from the registry. */
  themes: readonly ThemeConfig[];
}

const ThemePersonalityContext =
  React.createContext<ThemePersonalityContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────── */

interface ThemePersonalityProviderProps {
  children: React.ReactNode;
  /**
   * Initial personality used during SSR and before localStorage is read.
   * Defaults to "default" to match the data-theme="default" on <html> set
   * in the root layout — this prevents any flash of unstyled content.
   */
  defaultPersonality?: ThemePersonality;
}

export function ThemePersonalityProvider({
  children,
  defaultPersonality = DEFAULT_PERSONALITY,
}: ThemePersonalityProviderProps) {
  const [personality, setPersonalityState] =
    React.useState<ThemePersonality>(defaultPersonality);

  // On mount: read persisted preference and apply it.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(
        PERSONALITY_STORAGE_KEY,
      ) as ThemePersonality | null;
      if (stored && THEMES.some((t) => t.id === stored)) {
        setPersonalityState(stored);
      }
    } catch {
      // localStorage unavailable (e.g. incognito with blocked storage) — use default.
    }
  }, []);

  // Whenever personality changes: update DOM attribute + persist.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", personality);
    try {
      localStorage.setItem(PERSONALITY_STORAGE_KEY, personality);
    } catch {
      // Ignore write failures.
    }
  }, [personality]);

  const setPersonality = React.useCallback((theme: ThemePersonality) => {
    if (THEMES.some((t) => t.id === theme)) {
      setPersonalityState(theme);
    }
  }, []);

  return (
    <ThemePersonalityContext.Provider
      value={{ personality, setPersonality, themes: THEMES }}
    >
      {children}
    </ThemePersonalityContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────── */

/**
 * Access the active color personality and the setter from any client
 * component inside <ThemePersonalityProvider>.
 *
 * @example
 * const { personality, setPersonality, themes } = useThemePersonality();
 */
export function useThemePersonality(): ThemePersonalityContextValue {
  const ctx = React.useContext(ThemePersonalityContext);
  if (!ctx) {
    throw new Error(
      "useThemePersonality must be used within <ThemePersonalityProvider>.",
    );
  }
  return ctx;
}
