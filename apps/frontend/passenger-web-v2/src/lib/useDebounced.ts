import { useEffect, useState } from "react";

/** A value that only changes once it has stopped changing for `ms`: so typing in a search box asks once, not per key. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}
