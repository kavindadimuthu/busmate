import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { TrustChip } from "@/components/trust/TrustChip";
import { useFindMyBus } from "@/lib/findMyBusApi";
import { cn } from "@/lib/utils";
import { arrivalMinutes, cancelledLast, departureMinutes, detailPath, formatClock, hasPassed, sortBuses } from "@/lib/findMyBus.ts";

const MAX = 5;

/** Other buses between the same two stops on the same day. Reuses the results page's own search (same request,
 * so it is usually already cached), and stays out of the way: nothing shows while it loads or if there are none. */
export default function OtherDepartures({
  fromStopId,
  toStopId,
  date,
  currentScheduleId,
  currentTripId,
  className,
}: {
  fromStopId: string;
  toStopId: string;
  date: string;
  currentScheduleId: string;
  currentTripId: string;
  className?: string;
}) {
  const { data } = useFindMyBus(fromStopId, toStopId, date, true);
  const others = useMemo(() => {
    const rest = (data?.results ?? []).filter((b) => !(b.scheduleId === currentScheduleId && (b.tripId ?? "") === currentTripId));
    const upcoming = rest.filter((b) => !hasPassed(b, date));
    return cancelledLast(sortBuses(upcoming, "earliest")).slice(0, MAX);
  }, [data, date, currentScheduleId, currentTripId]);

  if (others.length === 0) return null;
  return (
    <section aria-label="Other buses between these stops" className={cn("rounded-2xl border border-border bg-card p-4 md:p-5", className)}>
      <h2 className="text-[15px] font-extrabold">Other buses between these stops</h2>
      <ul className="mt-3 grid gap-2">
        {others.map((b, i) => {
          const dep = departureMinutes(b);
          const arr = arrivalMinutes(b);
          const href = detailPath(b, fromStopId, toStopId, date);
          const body = (
            <>
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold leading-tight">
                  {dep != null ? formatClock(dep) : "—"} <span className="text-primary">→</span> {arr != null ? formatClock(arr) : "—"}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{[b.routeNumber && `Route ${b.routeNumber}`, b.operatorName].filter(Boolean).join(" · ")}</span>
              </span>
              {href && <ChevronRight className="h-5 w-5 flex-none text-muted-foreground" aria-hidden />}
            </>
          );
          return (
            <li key={b.tripId || `${b.scheduleId}-${i}`} className="flex items-center gap-2 rounded-xl border border-border bg-soft pr-3">
              {href ? (
                <Link to={href} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl py-2 pl-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 py-2 pl-3.5">{body}</div>
              )}
              <TrustChip trust={b.departureAtOriginTrust} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
