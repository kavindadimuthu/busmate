import type { ResourceConfig } from "./types";

/**
 * Identity helper for authoring a resource config with full type inference.
 * Exists so `TRow`/`TFilters` are inferred from the literal object passed in,
 * the same way `defineConfig` helpers work in other tools.
 */
export function defineResource<TRow, TFilters extends Record<string, any> = Record<string, any>>(
  config: ResourceConfig<TRow, TFilters>
): ResourceConfig<TRow, TFilters> {
  return config;
}
