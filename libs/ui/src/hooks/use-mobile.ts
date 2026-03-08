"use client";

import { useMediaQuery } from "./use-media-query";

/** Breakpoint below which the layout switches to mobile mode (< 768px). */
const MOBILE_BREAKPOINT = 768;

/**
 * Returns `true` when the viewport width is below the mobile breakpoint (768px).
 * Useful for conditionally rendering mobile-specific UI.
 *
 * @example
 * const isMobile = useMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
