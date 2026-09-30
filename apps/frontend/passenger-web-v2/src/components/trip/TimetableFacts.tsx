import type { ScheduleDetails, RouteDetails } from "@busmate/api-client-core";
import { TrustChip } from "@/components/trust/TrustChip";
import Disclosure, { Fact } from "./Disclosure";
import { dateStatus, daysPhrase, operatingDays, sortExceptions } from "@/lib/tripDetails.ts";
import { formatLongDate } from "@/lib/findMyBus.ts";
import { cn } from "@/lib/utils";

const EXCEPTION_KIND: Record<string, string> = {
  NO_SERVICE: "No service",
  SPECIAL_SERVICE: "Special service",
  HOLIDAY: "Holiday",
  ADDITIONAL: "Extra service",
};

const kindLabel = (k?: string) => (k ? EXCEPTION_KIND[k] ?? k.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "Exception");

/** Whether it runs on the chosen date, in the timetable's own terms. "Days not stated" is its own answer: the
 * timetable never said, which is not the same as yes or no (INC-055, ADR-023). */
export function DateStatusBadge({ isActiveOnDate, date }: { isActiveOnDate?: boolean | null; date: string }) {
  const status = dateStatus(isActiveOnDate);
  const text = { runs: "Runs on", no: "Doesn't run on", unstated: "Days not stated for" }[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold",
        status === "runs" && "border-green-200 bg-green-100 text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200",
        status === "no" && "border-red-200 bg-red-100 text-red-900 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
        status === "unstated" && "border-border bg-soft text-muted-foreground",
      )}
    >
      {text} {formatLongDate(date)}
    </span>
  );
}

const shortDate = (d?: string) => (d ? formatLongDate(d.slice(0, 10)) : "");

/** The timetable behind this departure: where it came from, what it doesn't say, its days and exceptions. */
export default function TimetableFacts({ schedule, date }: { schedule?: ScheduleDetails | null; date: string }) {
  if (!schedule) return null;
  const days = operatingDays(schedule.calendar);
  const exceptions = sortExceptions(schedule.exceptions);
  const affecting = exceptions.filter((e) => e.affectsQueryDate).length;

  return (
    <Disclosure
      title="About this timetable"
      hint={exceptions.length ? `${exceptions.length} exception${exceptions.length === 1 ? "" : "s"}${affecting ? `, ${affecting} on your date` : ""}` : days.length ? daysPhrase(days) : "Where it came from"}
    >
      {schedule.trust && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Timetable source:</span>
          <TrustChip trust={schedule.trust} />
        </div>
      )}
      {/* Where the timetable came from and what it doesn't say, e.g. that operating days were never stated. */}
      {schedule.description && (
        <p className="border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">{schedule.description}</p>
      )}

      <dl className="grid gap-2.5">
        {schedule.name && <Fact label="Timetable">{schedule.name}</Fact>}
        {schedule.scheduleType && <Fact label="Type">{schedule.scheduleType.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</Fact>}
        <Fact label={`On ${formatLongDate(date)}`}>
          <DateStatusBadge isActiveOnDate={schedule.isActiveOnDate} date={date} />
        </Fact>
        {days.length > 0 && <Fact label="Runs">{daysPhrase(days)}</Fact>}
        {(schedule.effectiveStartDate || schedule.effectiveEndDate) && (
          <Fact label="In force">
            {schedule.effectiveStartDate ? `From ${shortDate(schedule.effectiveStartDate)}` : "Until"}
            {schedule.effectiveEndDate ? ` to ${shortDate(schedule.effectiveEndDate)}` : ", no end date"}
          </Fact>
        )}
      </dl>
      {schedule.calendar?.operatingDaysSummary && <p className="text-xs text-muted-foreground">{schedule.calendar.operatingDaysSummary}</p>}

      {exceptions.length > 0 && (
        <div>
          <h3 className="mb-2 text-[13px] font-extrabold">Exceptions</h3>
          <ul className="grid gap-2">
            {exceptions.map((e, i) => (
              <li key={e.id || i} className={cn("rounded-xl border px-3.5 py-2.5 text-sm", e.affectsQueryDate ? "border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100" : "border-border bg-soft")}>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                  <span className="font-bold">{shortDate(e.exceptionDate) || "Date not given"}</span>
                  <span className="text-xs font-semibold opacity-80">{kindLabel(e.exceptionType)}</span>
                </div>
                {e.reason && <p className="mt-1 leading-relaxed opacity-90">{e.reason}</p>}
                {e.affectsQueryDate && <p className="mt-1 text-xs font-bold">Affects the date you're looking at</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Disclosure>
  );
}

/** The route this departure belongs to. */
export function RouteFacts({ route }: { route?: RouteDetails | null }) {
  if (!route) return null;
  return (
    <Disclosure title="About the route" hint={route.routeNumber ? `Route ${route.routeNumber}` : undefined}>
      {route.trust && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Route data:</span>
          <TrustChip trust={route.trust} />
        </div>
      )}
      <dl className="grid gap-2.5">
        {route.name && <Fact label="Route">{route.name}</Fact>}
        {route.routeNumber && <Fact label="Number">{route.routeNumber}</Fact>}
        {route.roadType && <Fact label="Road">{route.roadType === "EXPRESSWAY" ? "Expressway" : "Normal road"}</Fact>}
        {route.routeThrough && <Fact label="Via">{route.routeThrough}</Fact>}
        {route.totalDistanceKm ? <Fact label="Whole route">{route.totalDistanceKm} km</Fact> : null}
      </dl>
    </Disclosure>
  );
}
