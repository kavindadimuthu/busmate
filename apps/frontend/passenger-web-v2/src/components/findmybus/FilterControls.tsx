import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  NO_FILTERS,
  TIME_BANDS,
  activeFilterCount,
  bandOf,
  departureMinutes,
  roadTypeCounts,
  routeOptions,
  toggle,
  type BusLike,
  type Filters,
  type RoadType,
  type SortKey,
  SORTS,
  type TimeBand,
} from "@/lib/findMyBus";
import { cn } from "@/lib/utils";

/** A toggle pill. 40px tall so it can be hit with a thumb. A forwardRef so it can be a Radix trigger. */
export const Chip = forwardRef<
  HTMLButtonElement,
  { pressed: boolean; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed">
>(function Chip({ pressed, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pressed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/60",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

function bandCounts(buses: BusLike[]): Record<TimeBand, number> {
  const counts: Record<TimeBand, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const b of buses) {
    const dep = departureMinutes(b);
    if (dep != null) counts[bandOf(dep)]++;
  }
  return counts;
}

/** The four time-of-day chips, as a row that scrolls sideways on a phone. */
export function TimeBandChips({ buses, filters, onChange }: { buses: BusLike[]; filters: Filters; onChange: (f: Filters) => void }) {
  const counts = bandCounts(buses);
  return (
    <>
      {TIME_BANDS.map((b) => {
        const on = filters.bands.includes(b.id);
        return (
          <Chip key={b.id} pressed={on} disabled={!on && counts[b.id] === 0} onClick={() => onChange({ ...filters, bands: toggle(filters.bands, b.id) })}>
            {b.label}
            <span className={cn("text-xs font-medium", on ? "opacity-85" : "text-muted-foreground")}>{counts[b.id]}</span>
          </Chip>
        );
      })}
    </>
  );
}

export function SortTabs({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <div role="group" aria-label="Sort buses by" className="flex gap-1 rounded-xl border border-border bg-alt p-1">
      {SORTS.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={value === s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "min-h-10 flex-1 rounded-[9px] px-3 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="grid gap-2.5">
    <legend className="mb-0.5 text-[13px] font-extrabold">{title}</legend>
    {children}
  </fieldset>
);

/** Everything that narrows the list, for the desktop sidebar and the phone's filter sheet. Options a
 * search can't offer (a road type or route it has none of) are left out rather than shown dead. */
export function FiltersPanel({ buses, filters, onChange, showTimes = true }: { buses: BusLike[]; filters: Filters; onChange: (f: Filters) => void; showTimes?: boolean }) {
  const roads = roadTypeCounts(buses);
  const routes = routeOptions(buses);
  const roadOptions: { id: RoadType; label: string; count: number }[] = [
    { id: "NORMALWAY", label: "Normal road", count: roads.NORMALWAY },
    { id: "EXPRESSWAY", label: "Expressway", count: roads.EXPRESSWAY },
  ];
  const showRoad = roads.NORMALWAY > 0 && roads.EXPRESSWAY > 0;

  return (
    <div className="grid gap-5">
      {showTimes && (
        <Section title="Departure time">
          <div className="flex flex-wrap gap-2">
            <TimeBandChips buses={buses} filters={filters} onChange={onChange} />
          </div>
        </Section>
      )}
      {showRoad && (
        <Section title="Road type">
          <div className="flex flex-wrap gap-2">
            {roadOptions.map((r) => (
              <Chip key={r.id} pressed={filters.roadType === r.id} onClick={() => onChange({ ...filters, roadType: filters.roadType === r.id ? "" : r.id })}>
                {r.label}
                <span className={cn("text-xs font-medium", filters.roadType === r.id ? "opacity-85" : "text-muted-foreground")}>{r.count}</span>
              </Chip>
            ))}
          </div>
        </Section>
      )}
      {routes.length > 1 && (
        <Section title="Route">
          <div className="flex flex-wrap gap-2">
            {routes.map((r) => (
              <Chip key={r.route} pressed={filters.routes.includes(r.route)} onClick={() => onChange({ ...filters, routes: toggle(filters.routes, r.route) })}>
                {r.route}
                <span className={cn("text-xs font-medium", filters.routes.includes(r.route) ? "opacity-85" : "text-muted-foreground")}>{r.count}</span>
              </Chip>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export function ClearFilters({ filters, onChange, className }: { filters: Filters; onChange: (f: Filters) => void; className?: string }) {
  if (activeFilterCount(filters) === 0) return null;
  return (
    <button
      type="button"
      onClick={() => onChange(NO_FILTERS)}
      className={cn("inline-flex min-h-10 items-center gap-1 rounded-lg px-1 text-[13px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      <X className="h-4 w-4" aria-hidden />
      Clear filters
    </button>
  );
}
