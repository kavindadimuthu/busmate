import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { RouteResponse } from "@busmate/api-client-core";
import { TrustChip } from "@/components/trust/TrustChip";
import { formatDuration, shortStopName } from "@/lib/findMyBus.ts";
import { formatKm, roadTypeLabel, stopCount } from "@/lib/routes.ts";

const Pill = ({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) => (
  <span className={strong ? "inline-flex min-h-7 items-center rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground" : "inline-flex min-h-7 items-center rounded-full border border-border bg-soft px-2.5 text-xs font-semibold text-muted-foreground"}>
    {children}
  </span>
);

/** One route in the list. The whole card opens the route; the trust chip sits above that link so it can be tapped by itself. */
export default function RouteCard({ route }: { route: RouteResponse }) {
  const from = route.startStopName ? shortStopName(route.startStopName) : null;
  const to = route.endStopName ? shortStopName(route.endStopName) : null;
  const km = formatKm(route.distanceKm);
  const duration = formatDuration(route.estimatedDurationMinutes);
  const stops = stopCount(route);
  const facts = [km, duration, stops > 0 ? `${stops} stops` : null].filter(Boolean).join(" · ");
  const road = roadTypeLabel(route.roadType);

  return (
    <article className="relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-primary/60 md:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {route.routeNumber && <Pill strong>Route {route.routeNumber}</Pill>}
        {road && <Pill>{road}</Pill>}
      </div>
      <h2 className="mt-3 text-[17px] font-extrabold leading-tight">
        <Link to={`/routes/${route.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {from && to ? (
            <>
              {from} <span className="text-primary">→</span> {to}
            </>
          ) : (
            route.name
          )}
        </Link>
      </h2>
      {route.routeThrough && <p className="mt-1 text-[13px] text-muted-foreground">via {route.routeThrough}</p>}
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <p className="min-w-0 text-[13px] font-semibold">{facts || "Details not recorded"}</p>
        <span className="relative z-10 flex flex-none items-center gap-1">
          <TrustChip trust={route.trust} iconOnly prefix="Route data" />
          <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
        </span>
      </div>
    </article>
  );
}
