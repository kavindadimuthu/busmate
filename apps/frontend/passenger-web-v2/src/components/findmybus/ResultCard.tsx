import { Link } from "react-router-dom";
import type { BusResult } from "@busmate/api-client-core";
import { TrustChip } from "@/components/trust/TrustChip";
import { UsualWorkingLine } from "./UsualWorkingLine";
import {
  arrivalMinutes,
  arrivesNextDay,
  departureMinutes,
  detailPath,
  formatClock,
  formatDuration,
  isCancelled,
  journeyMinutes,
  statusLabel,
  type StatusTone,
} from "@/lib/findMyBus";
import { cn } from "@/lib/utils";

const TONE: Record<StatusTone, string> = {
  good: "border-green-200 bg-green-100 text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200",
  warn: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  bad: "border-red-200 bg-red-100 text-red-900 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
};

const Tag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("inline-flex min-h-7 items-center rounded-full border border-border bg-soft px-2.5 text-xs font-semibold text-muted-foreground", className)}>
    {children}
  </span>
);

interface ResultCardProps {
  bus: BusResult;
  fromStopId: string;
  toStopId: string;
  fromName: string;
  toName: string;
  date: string;
  /** Today's scheduled time has gone: the card stays, quieter. */
  passed?: boolean;
}

/** One bus between the passenger's two stops. Only what the search can actually tell us: no price, rating,
 * seats or amenities, none of which it carries. */
export default function ResultCard({ bus, fromStopId, toStopId, fromName, toName, date, passed }: ResultCardProps) {
  const dep = departureMinutes(bus);
  const arr = arrivalMinutes(bus);
  const duration = formatDuration(journeyMinutes(bus));
  const status = statusLabel(bus.tripStatus);
  const details = detailPath(bus, fromStopId, toStopId, date);
  const sameTrust = bus.departureAtOriginTrust?.label === bus.arrivalAtDestinationTrust?.label;
  const km = bus.distanceKm && bus.distanceKm > 0 ? `${bus.distanceKm.toFixed(bus.distanceKm % 1 ? 1 : 0)} km` : null;

  return (
    <article className={cn("rounded-2xl border border-border bg-card p-4 md:p-5", (passed || isCancelled(bus)) && "bg-soft")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {bus.routeNumber && (
          <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-extrabold text-primary">Route {bus.routeNumber}</span>
        )}
        {bus.roadType === "EXPRESSWAY" && <span className="text-xs font-semibold text-muted-foreground">Expressway</span>}
        {status && (
          <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold", TONE[status.tone])}>
            {status.text}
          </span>
        )}
        {passed && <Tag>Scheduled time has passed</Tag>}
      </div>

      <h3 className="mt-2 text-[17px] font-extrabold leading-snug">{bus.routeName || "Bus service"}</h3>
      {bus.routeThrough && <p className="mt-0.5 text-[13px] text-muted-foreground">via {bus.routeThrough}</p>}

      <div className={cn("mt-4 grid grid-cols-[minmax(0,1fr)_minmax(64px,auto)_minmax(0,1fr)] items-start gap-2.5 md:grid-cols-[minmax(0,15rem)_minmax(110px,1fr)_minmax(0,15rem)] md:gap-4", (passed || isCancelled(bus)) && "opacity-75")}>
        <div className="min-w-0">
          <div className="text-[22px] font-extrabold leading-none tracking-[-0.01em] md:text-2xl">{dep != null ? formatClock(dep) : "—"}</div>
          <div className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{fromName}</div>
        </div>
        <div className="grid justify-items-center gap-1.5 pt-0.5 text-center">
          <span className="text-xs font-semibold text-muted-foreground">{duration ?? " "}</span>
          <span aria-hidden className="h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-highlight" />
          <span className="text-[11px] text-muted-foreground">{km ?? " "}</span>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[22px] font-extrabold leading-none tracking-[-0.01em] md:text-2xl">
            {arr != null ? formatClock(arr) : "—"}
            {arrivesNextDay(bus) && (
              <sup title="Arrives the next day" className="ml-0.5 text-[11px] font-bold text-muted-foreground">
                +1<span className="sr-only"> day</span>
              </sup>
            )}
          </div>
          <div className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{toName}</div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {sameTrust ? (
          <TrustChip trust={bus.departureAtOriginTrust ?? bus.arrivalAtDestinationTrust} prefix="Times" />
        ) : (
          <>
            <TrustChip trust={bus.departureAtOriginTrust} prefix="Departs" />
            <TrustChip trust={bus.arrivalAtDestinationTrust} prefix="Arrives" />
          </>
        )}
        {bus.operatorName && <Tag>{bus.operatorName}</Tag>}
        {bus.busPlateNumber && <Tag>{bus.busPlateNumber}</Tag>}
        {bus.busModel && <Tag>{bus.busModel}</Tag>}
        {bus.busCapacity ? <Tag>{bus.busCapacity} seats</Tag> : null}
      </div>

      <div className="mt-3">
        <UsualWorkingLine workings={bus.usualWorkings} limit={2} />
      </div>

      {details && (
        <Link
          to={details}
          className="mt-4 flex min-h-11 items-center justify-center rounded-xl border-[1.5px] border-primary text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-flex md:px-6"
        >
          View details →
        </Link>
      )}
    </article>
  );
}
