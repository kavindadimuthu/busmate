/**
 * Theme Personality Registry
 *
 * A "personality" is a named color scheme (distinct from light/dark mode).
 * Light/dark is handled orthogonally by next-themes (.dark class on <html>).
 * The personality is set via data-theme="<id>" on <html>.
 *
 * To add a new theme
 * ──────────────────
 * 1. Create  libs/ui/src/styles/themes/<name>.css
 *    with [data-theme="<name>"] and [data-theme="<name>"].dark rule-sets.
 * 2. Add one @import in libs/ui/src/styles/globals.css.
 * 3. Add one entry to the THEMES array below.
 * That's it — the new theme becomes available in ThemePersonalitySwitcher
 * automatically.
 */

export interface ThemeConfig {
  /** Matches the data-theme attribute value and the CSS filename. */
  id: ThemePersonality;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Short description for tooltips / accessibility. */
  description: string;
  /** CSS color string shown as a swatch in the switcher UI. */
  previewColor: string;
  /** Secondary swatch color (optional — shown as gradient stop). */
  previewColorDark?: string;
}

/** Union of all registered personality ids. Extend when adding themes. */
export type ThemePersonality = "default" | "ocean" | "slate";

/**
 * Registered themes. Order determines display order in the switcher.
 * Add entries here when creating new theme CSS files.
 */
export const THEMES: readonly ThemeConfig[] = [
  {
    id: "default",
    label: "Default",
    description: "BusMate Blue — the classic brand theme",
    previewColor: "hsl(221 83% 53%)",
    previewColorDark: "hsl(217 91% 60%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Cool teal and cyan — refreshing and modern",
    previewColor: "hsl(174 60% 36%)",
    previewColorDark: "hsl(174 55% 48%)",
  },
  {
    id: "slate",
    label: "Slate",
    description: "Rich violet and purple — polished and contemporary",
    previewColor: "hsl(258 84% 59%)",
    previewColorDark: "hsl(259 87% 67%)",
  },
] as const;

export const DEFAULT_PERSONALITY: ThemePersonality = "default";
export const PERSONALITY_STORAGE_KEY = "busmate-theme-personality";
