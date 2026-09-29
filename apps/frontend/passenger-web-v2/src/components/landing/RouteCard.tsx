import { Link } from "react-router-dom";
import type { RouteResponse } from "@busmate/api-client-core";
import { formatDuration } from "@/lib/network";

/** The design shows a stock photo per route; there are none, so the card's visual is the route
 * itself — its stops placed along a line by their real distance from the start. */
function RouteLine({ route }: { route: RouteResponse }) {
  const stops = [...(route.routeStops ?? [])].sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
  const total = route.distanceKm || stops[stops.length - 1]?.distanceFromStartKm || 0;
  const at = (km: number | undefined, i: number) =>
    total > 0 && km != null ? Math.min(100, Math.max(0, (km / total) * 100)) : (i / Math.max(1, stops.length - 1)) * 100;

  return (
    <div className="flex h-[130px] flex-col justify-center gap-3 bg-gradient-to-br from-tint to-soft px-6">
      <div className="relative h-2">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-highlight" />
        {stops.map((s, i) => {
          const end = i === 0 || i === stops.length - 1;
          return (
            <span
              key={s.id ?? i}
              title={s.stopName}
              style={{ left: `${at(s.distanceFromStartKm, i)}%` }}
              className={
                end
                  ? "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary bg-card"
                  : "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              }
            />
          );
        })}
      </div>
      <div className="flex justify-between gap-3 font-mono text-[11px] text-muted-foreground">
        <span className="truncate">{route.startStopName}</span>
        <span className="truncate text-right">{route.endStopName}</span>
      </div>
    </div>
  );
}

export default function RouteCard({ route }: { route: RouteResponse }) {
  const duration = formatDuration(route.estimatedDurationMinutes);
  const stopCount = route.routeStops?.length ?? 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <RouteLine route={route} />
      <div className="p-[18px]">
        <div className="mb-1 flex items-center gap-2">
          {route.routeNumber && (
            <span className="rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-extrabold text-primary">
              Route {route.routeNumber}
            </span>
          )}
          {route.roadType === "EXPRESSWAY" && (
            <span className="text-[11px] font-semibold text-muted-foreground">Expressway</span>
          )}
        </div>
        <h3 className="text-[17px] font-bold leading-snug">
          {route.startStopLocation?.city || route.startStopName} <span className="text-primary">→</span>{" "}
          {route.endStopLocation?.city || route.endStopName}
        </h3>
        <div className="mb-4 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          {duration && <span>{duration}</span>}
          {route.distanceKm ? <span>{route.distanceKm} km</span> : null}
          {stopCount > 0 && <span>{stopCount} stops</span>}
        </div>
        <Link
          to={`/routes/${route.id}`}
          className="flex min-h-11 items-center justify-center rounded-[10px] border-[1.5px] border-primary text-center text-[13px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          View Route →
        </Link>
      </div>
    </article>
  );
}
