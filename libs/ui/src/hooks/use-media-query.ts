"use client";

import * as React from "react";

/**
 * Returns true when the given media query matches.
 * Correctly handles SSR by defaulting to false on the server.
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    // Set the initial value
    setMatches(mediaQueryList.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", listener);

    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
