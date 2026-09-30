import type { FindMyBusDetailsResponse } from "@busmate/api-client-core";
import { TrustChip } from "@/components/trust/TrustChip";
import { DateStatusBadge } from "./TimetableFacts";
import { formatClock, formatDuration, hasPassed, journeyMinutes, parseTimeOfDay } from "@/lib/findMyBus.ts";

/** The journey at a glance: leaves, arrives, how long, how far, how far to trust the times, and whether it runs. */
export default function JourneyCard({ data, date }: { data: FindMyBusDetailsResponse; date: string }) {
  const js = data.journeySummary!;
  const dep = parseTimeOfDay(js.departureFromOrigin);
  const arr = parseTimeOfDay(js.arrivalAtDestination);
  const nextDay = dep != null && arr != null && arr < dep;
  const minutes = journeyMinutes({
    estimatedDurationMinutes: js.estimatedDurationMinutes,
    departureAtOrigin: js.departureFromOrigin,
    arrivalAtDestination: js.arrivalAtDestination,
  });
  const duration = formatDuration(minutes);
  const km = js.distanceKm && js.distanceKm > 0 ? `${js.distanceKm.toFixed(js.distanceKm % 1 ? 1 : 0)} km` : null;
  const sameTrust = js.departureTimeTrust?.label === js.arrivalTimeTrust?.label;
  const between = js.intermediateStopCount ?? 0;

  return (
    <section aria-label="Journey" className="rounded-2xl border border-border bg-card p-4 shadow-float md:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(64px,auto)_minmax(0,1fr)] items-start gap-2.5 md:grid-cols-[minmax(0,15rem)_minmax(110px,1fr)_minmax(0,15rem)] md:gap-4">
        <div className="min-w-0">
          <div className="text-[26px] font-extrabold leading-none tracking-[-0.02em] md:text-4xl">{dep != null ? formatClock(dep) : "—"}</div>
          <div className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground md:text-[13px]">{js.originStop?.name}</div>
        </div>
        <div className="grid justify-items-center gap-1.5 pt-1 text-center">
          <span className="text-xs font-bold text-muted-foreground">{duration ?? " "}</span>
          <span aria-hidden className="h-[3px] w-full rounded-full bg-gradient-to-r from-primary to-highlight" />
          <span className="text-[11px] text-muted-foreground">{[km, between > 0 ? `${between} stop${between === 1 ? "" : "s"} between` : null].filter(Boolean).join(" · ") || " "}</span>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[26px] font-extrabold leading-none tracking-[-0.02em] md:text-4xl">
            {arr != null ? formatClock(arr) : "—"}
            {nextDay && (
              <sup title="Arrives the next day" className="ml-0.5 text-xs font-bold text-muted-foreground">
                +1<span className="sr-only"> day</span>
              </sup>
            )}
          </div>
          <div className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground md:text-[13px]">{js.destinationStop?.name}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3.5">
        {sameTrust ? (
          <TrustChip trust={js.departureTimeTrust ?? js.arrivalTimeTrust} prefix="Times" />
        ) : (
          <>
            <TrustChip trust={js.departureTimeTrust} prefix="Departs" />
            <TrustChip trust={js.arrivalTimeTrust} prefix="Arrives" />
          </>
        )}
        <DateStatusBadge isActiveOnDate={data.schedule?.isActiveOnDate} date={date} />
        {hasPassed({ departureAtOrigin: js.departureFromOrigin, actualDepartureTime: data.trip?.actualDepartureTime }, date) && (
          <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-soft px-2.5 text-xs font-semibold text-muted-foreground">Scheduled time has passed</span>
        )}
      </div>
    </section>
  );
}
