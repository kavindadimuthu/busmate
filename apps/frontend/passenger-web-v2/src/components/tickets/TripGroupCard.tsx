import { Link } from "react-router-dom";
import { Ban, CalendarDays, ChevronRight, Clock } from "lucide-react";
import type { ConductorLogTicketDTO } from "@busmate/api-client-ticketing";
import { TrustChip } from "@/components/trust/TrustChip";
import StatusBadge from "./StatusBadge";
import { useTripDetails } from "@/lib/tripDetailsApi";
import { useTripRecord } from "@/lib/ticketsApi";
import { formatClock, formatLongDate, parseTimeOfDay, shortStopName } from "@/lib/findMyBus.ts";
import { formatMoney } from "@/lib/booking/payment.ts";
import type { TicketGroup } from "@/lib/tickets.ts";

/** One trip and the passenger's seats on it. The trip's own facts (when, which stops, how far to trust the time)
 * come from the trip record and the same details lookup the bus's page uses; the seats and their status are the
 * tickets. If either lookup fails the seats still show: a ticket is never hidden for want of a name. */
export default function TripGroupCard({ group }: { group: TicketGroup<ConductorLogTicketDTO> }) {
  const trip = useTripRecord(group.tripId).data;
  const date = trip?.tripDate ?? "";
  const details = useTripDetails(
    { scheduleId: trip?.scheduleId ?? "", fromStopId: group.startLocationId, toStopId: group.endLocationId, tripId: group.tripId, date },
    !!trip?.scheduleId && !!date && !!group.startLocationId && !!group.endLocationId,
  ).data;
  const js = details?.success === false ? undefined : details?.journeySummary;
  const dep = parseTimeOfDay(js?.departureFromOrigin ?? trip?.scheduledDepartureTime);
  const from = js?.originStop?.name;
  const to = js?.destinationStop?.name;
  const cancelled = trip?.status?.toLowerCase() === "cancelled";

  return (
    <article className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h3 className="text-[17px] font-extrabold leading-tight">
        {from && to ? (
          <>
            {shortStopName(from)} <span className="text-primary">→</span> {shortStopName(to)}
          </>
        ) : (
          "Your trip"
        )}
      </h3>
      {(trip?.routeName || trip?.operatorName) && (
        <p className="mt-0.5 text-[13px] text-muted-foreground">{[trip?.routeName, trip?.operatorName].filter(Boolean).join(" · ")}</p>
      )}
      <dl className="mt-3 grid gap-2 text-sm">
        {date && (
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 flex-none text-primary" aria-hidden />
            <dt className="sr-only">Date</dt>
            <dd className="font-semibold">{formatLongDate(date)}</dd>
          </div>
        )}
        {dep != null && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Clock className="h-4 w-4 flex-none text-primary" aria-hidden />
            <dt className="sr-only">Leaves</dt>
            <dd className="font-semibold">Leaves {formatClock(dep)}</dd>
            {/* A time is never shown without how far to trust it. Absent (lookup failed) means no time claim is made below. */}
            <TrustChip trust={js?.departureTimeTrust} />
          </div>
        )}
      </dl>
      {cancelled && (
        <p role="note" className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          <Ban className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          The operator has cancelled this trip.
        </p>
      )}
      <ul className="mt-3 grid gap-2">
        {group.tickets.map((t) => (
          <li key={t.ticketId}>
            <Link
              to={`/tickets/${t.ticketId}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-soft px-3.5 py-2 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-bold">Seat {t.seatNumber ?? "—"}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <StatusBadge status={t.bookingStatus} />
                  <span>#{t.ticketId}</span>
                </span>
              </span>
              <span className="flex flex-none items-center gap-2 text-sm font-bold">
                {formatMoney(t.fareAmount ?? 0)}
                <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
