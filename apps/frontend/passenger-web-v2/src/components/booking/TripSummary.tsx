import type { TrustInfo } from "@busmate/api-client-core";
import { CalendarDays, Clock, Bus } from "lucide-react";
import { TrustChip } from "@/components/trust/TrustChip";
import { formatClock, formatLongDate, parseTimeOfDay, shortStopName } from "@/lib/findMyBus.ts";
import type { BookingTrip } from "@/lib/booking/BookingContext";
import type { TrustKey } from "@/lib/trust";

const KEYS: TrustKey[] = ["OFFICIAL", "OPERATOR_TIMETABLE", "OBSERVED", "REPORTED", "ESTIMATED", "LIVE"];

/** The trip being booked: route, day, when it leaves (with how far to trust that) and which bus. */
export default function TripSummary({ trip }: { trip: BookingTrip }) {
  const dep = parseTimeOfDay(trip.departureTime);
  const trustKey = KEYS.find((k) => k === trip.departureTrust);
  return (
    <section aria-label="Your trip" className="rounded-2xl border border-border bg-card p-4 shadow-float md:p-5">
      <p className="text-lg font-extrabold leading-tight">
        {shortStopName(trip.fromStopName)} <span className="text-primary">→</span> {shortStopName(trip.toStopName)}
      </p>
      {trip.routeName && <p className="mt-0.5 text-[13px] text-muted-foreground">{trip.routeName}</p>}
      <dl className="mt-3 grid gap-2 text-sm">
        {trip.tripDate && (
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 flex-none text-primary" aria-hidden />
            <dt className="sr-only">Date</dt>
            <dd className="font-semibold">{formatLongDate(trip.tripDate)}</dd>
          </div>
        )}
        {dep != null && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Clock className="h-4 w-4 flex-none text-primary" aria-hidden />
            <dt className="sr-only">Leaves</dt>
            <dd className="font-semibold">Leaves {formatClock(dep)}</dd>
            {trustKey && <TrustChip trust={{ label: trustKey as TrustInfo.label }} />}
          </div>
        )}
        {(trip.busPlateNumber || trip.operatorName) && (
          <div className="flex items-center gap-2.5">
            <Bus className="h-4 w-4 flex-none text-primary" aria-hidden />
            <dt className="sr-only">Bus</dt>
            <dd>{[trip.operatorName, trip.busPlateNumber].filter(Boolean).join(" · ")}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
