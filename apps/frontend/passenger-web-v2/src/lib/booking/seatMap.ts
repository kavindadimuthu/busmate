// Pure seat-map logic, no React: which seats a bus has, which can be picked, and how a pick changes.
// Erasable TypeScript only so `node --test` can run it.

/** Matches core-service's Bus.seatLayout shape. */
export interface SeatLayoutRow {
  left?: string[];
  right?: string[];
  back?: string[];
}
export interface SeatLayout {
  layoutName?: string;
  rows: SeatLayoutRow[];
  blockedSeats?: string[];
}

/** Mirrors ticketing-service's `booking.max-seats-per-booking`; the server enforces the real limit. */
export const MAX_SEATS_PER_BOOKING = 5;

export type SeatState = "available" | "selected" | "taken" | "blocked";

/** A 2+2 layout numbered 1..capacity, for buses whose record has no layout of its own. */
export function defaultLayout(capacity: number): SeatLayout {
  const rows: SeatLayoutRow[] = [];
  let n = 1;
  while (n <= capacity) {
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i < 2 && n <= capacity; i++) left.push(String(n++));
    for (let i = 0; i < 2 && n <= capacity; i++) right.push(String(n++));
    rows.push({ left, right });
  }
  return { layoutName: `2+2 (${capacity})`, rows, blockedSeats: [] };
}

/** The bus's own layout when it has rows, otherwise a default one for its capacity. Null when neither exists. */
export function resolveLayout(layout: unknown, capacity?: number | null): SeatLayout | null {
  const l = layout as SeatLayout | null | undefined;
  if (l && Array.isArray(l.rows) && l.rows.length > 0) return l;
  return capacity && capacity > 0 ? defaultLayout(capacity) : null;
}

/** Every seat label in the layout, front to back. */
export function layoutSeats(layout: SeatLayout): string[] {
  return layout.rows.flatMap((r) => [...(r.left ?? []), ...(r.right ?? []), ...(r.back ?? [])]).map(String);
}

export function seatState(seat: string, taken: ReadonlySet<string>, selected: readonly string[], blocked: ReadonlySet<string>): SeatState {
  if (blocked.has(seat)) return "blocked";
  if (taken.has(seat)) return "taken";
  return selected.includes(seat) ? "selected" : "available";
}

export type ToggleResult = { selected: string[]; refused?: "limit" | "unavailable" };

/** Pick or un-pick a seat. Refuses a seat that is taken or blocked, and a sixth seat; says why. */
export function toggleSeat(
  selected: readonly string[],
  seat: string,
  taken: ReadonlySet<string>,
  blocked: ReadonlySet<string>,
  max: number = MAX_SEATS_PER_BOOKING,
): ToggleResult {
  if (selected.includes(seat)) return { selected: selected.filter((s) => s !== seat) };
  if (taken.has(seat) || blocked.has(seat)) return { selected: [...selected], refused: "unavailable" };
  if (selected.length >= max) return { selected: [...selected], refused: "limit" };
  return { selected: [...selected, seat] };
}

/** After the taken list refreshes, drop any picked seat that has since become unavailable; says which were dropped. */
export function dropUnavailable(selected: readonly string[], taken: ReadonlySet<string>, blocked: ReadonlySet<string>): { selected: string[]; dropped: string[] } {
  const keep = selected.filter((s) => !taken.has(s) && !blocked.has(s));
  return { selected: keep, dropped: selected.filter((s) => !keep.includes(s)) };
}

/** Seats in the order they read best: numeric ones by number, then the rest alphabetically. */
export function sortSeats(seats: readonly string[]): string[] {
  return [...seats].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
