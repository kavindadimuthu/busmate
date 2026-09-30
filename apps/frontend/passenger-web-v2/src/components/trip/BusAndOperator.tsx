import { Link } from "react-router-dom";
import { Accessibility, Phone, Snowflake } from "lucide-react";
import type { TripDetails, UsualWorking } from "@busmate/api-client-core";
import { UsualWorkingLine } from "@/components/findmybus/UsualWorkingLine";
import Disclosure, { Fact } from "./Disclosure";
import { statusLabel } from "@/lib/findMyBus.ts";
import { cn } from "@/lib/utils";

const TONE = {
  good: "border-green-200 bg-green-100 text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200",
  warn: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  bad: "border-red-200 bg-red-100 text-red-900 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
} as const;

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-soft px-2.5 text-xs font-semibold text-muted-foreground">{children}</span>
);

/** "5 min late" / "2 min early" / null when on time or unknown. */
function delayText(minutes?: number | null): string | null {
  if (!minutes) return null;
  return minutes > 0 ? `${minutes} min late` : `${Math.abs(minutes)} min early`;
}

/** Who runs this departure and with what bus. Only what the records state: air conditioning and accessibility
 * appear when recorded as true, never as a claim of their absence. */
export default function BusAndOperator({
  trip,
  usualWorkings,
  scheduleId,
  className,
}: {
  trip?: TripDetails | null;
  usualWorkings?: UsualWorking[] | null;
  scheduleId: string;
  className?: string;
}) {
  const bus = trip?.bus;
  const operator = trip?.operator;
  const status = statusLabel(trip?.status);
  const delay = delayText(trip?.delayMinutes);
  const workings = (usualWorkings ?? []).filter((w) => w.operatorName || (w.plates && w.plates.length > 0));
  if (!trip && workings.length === 0) return null;

  return (
    <Disclosure title={trip ? "Bus and operator" : "Who usually runs it"} hint={operator?.name ?? bus?.plateNumber} defaultOpen className={className}>
      {trip && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {status && <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold", TONE[status.tone])}>{status.text}</span>}
            {delay && <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold", trip.delayMinutes! > 0 ? TONE.warn : TONE.good)}>{delay}</span>}
            {bus?.hasAirConditioning && (
              <Chip>
                <Snowflake className="h-3.5 w-3.5" aria-hidden />
                Air-conditioned
              </Chip>
            )}
            {bus?.isAccessible && (
              <Chip>
                <Accessibility className="h-3.5 w-3.5" aria-hidden />
                Accessible
              </Chip>
            )}
          </div>
          <dl className="grid gap-2.5">
            {bus?.plateNumber && <Fact label="Plate">{bus.plateNumber}</Fact>}
            {(bus?.manufacturer || bus?.model) && <Fact label="Bus">{[bus.manufacturer, bus.model].filter(Boolean).join(" ")}{bus.manufactureYear ? ` (${bus.manufactureYear})` : ""}</Fact>}
            {bus?.capacity ? <Fact label="Seats">{bus.capacity}</Fact> : null}
            {operator?.name && <Fact label="Operator">{operator.name}</Fact>}
            {operator?.operatorType && <Fact label="Type">{operator.operatorType}</Fact>}
            {operator?.region && <Fact label="Region">{operator.region}</Fact>}
            {trip.psp?.permitNumber && <Fact label="Permit no.">{trip.psp.permitNumber}</Fact>}
          </dl>
          {operator?.contactNumber && (
            <a
              href={`tel:${operator.contactNumber}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Call {operator.contactNumber}
            </a>
          )}
        </>
      )}

      {workings.length > 0 && (
        <div className="grid gap-2">
          <UsualWorkingLine workings={usualWorkings} />
          {workings.filter((w) => w.id).map((w) => (
            <Link key={w.id} to={`/contribute/correct-working?workingId=${encodeURIComponent(w.id!)}`} className="inline-flex min-h-10 items-center text-[13px] font-semibold text-primary hover:underline">
              {w.operatorName ? `“${w.operatorName}” wrong or stopped? Tell us` : "Something wrong here? Tell us"}
            </Link>
          ))}
        </div>
      )}
      <Link to={`/contribute/propose-working?scheduleId=${encodeURIComponent(scheduleId)}`} className="inline-flex min-h-10 items-center text-[13px] font-semibold text-muted-foreground hover:text-primary hover:underline">
        {workings.length > 0 ? "Know of another bus that runs this too?" : "Know who runs this bus? Tell us"}
      </Link>
    </Disclosure>
  );
}
