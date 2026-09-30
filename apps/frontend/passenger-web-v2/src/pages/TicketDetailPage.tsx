import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Armchair, Ban, Bus, CalendarDays, CheckCircle2, Clock, Loader2, Phone, Printer, RefreshCw, SearchX, Ticket, User } from "lucide-react";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { TrustChip } from "@/components/trust/TrustChip";
import StatusBadge from "@/components/tickets/StatusBadge";
import TicketQr from "@/components/tickets/TicketQr";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthContext";
import { bookingProblem } from "@/lib/booking/bookingApi";
import { formatMoney } from "@/lib/booking/payment.ts";
import { NOT_A_TICKET, useTicket, useTripRecord, ticketsProblem } from "@/lib/ticketsApi";
import { useTripDetails } from "@/lib/tripDetailsApi";
import { canCancel, qrPayload, showsQr, statusInfo } from "@/lib/tickets.ts";
import { formatClock, formatLongDate, parseTimeOfDay, shortStopName } from "@/lib/findMyBus.ts";

const Fact = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 flex-none text-primary" aria-hidden>{icon}</span>
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  </div>
);

/** One seat's ticket: the boarding pass. Shows only what BusMate knows: no "paid" (a confirmed booking may
 * not have taken money while payments are off) and no invented fields. */
export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id && /^\d+$/.test(id) ? Number(id) : null;
  const { user } = useAuth();
  const qc = useQueryClient();
  const ticketQuery = useTicket(ticketId);
  const ticket = ticketQuery.data;
  const trip = useTripRecord(ticket?.tripId).data;
  const date = trip?.tripDate ?? "";
  const details = useTripDetails(
    { scheduleId: trip?.scheduleId ?? "", fromStopId: ticket?.startLocationId ?? "", toStopId: ticket?.endLocationId ?? "", tripId: ticket?.tripId ?? "", date },
    !!trip?.scheduleId && !!date && !!ticket?.startLocationId && !!ticket?.endLocationId,
  ).data;
  const js = details?.success === false ? undefined : details?.journeySummary;
  const from = js?.originStop?.name;
  const to = js?.destinationStop?.name;
  const dep = parseTimeOfDay(js?.departureFromOrigin ?? trip?.scheduledDepartureTime);
  const operatorPhone = details?.trip?.operator?.contactNumber;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelProblem, setCancelProblem] = useState<string | null>(null);

  useEffect(() => {
    document.title = ticketId ? `Ticket #${ticketId} · BusMate` : "Ticket · BusMate";
  }, [ticketId]);

  const cancel = useMutation({
    // The server refuses a cancel with no body, so a reason always goes with it.
    mutationFn: () => TicketControllerService.cancelTicket(ticketId!, { reason: "Cancelled by passenger" }),
    onSuccess: async () => {
      setConfirmOpen(false);
      setCancelled(true);
      await Promise.all([qc.invalidateQueries({ queryKey: ["ticket", ticketId] }), qc.invalidateQueries({ queryKey: ["my-tickets"] }), qc.invalidateQueries({ queryKey: ["occupied-seats"] })]);
    },
    onError: (e) => {
      setConfirmOpen(false);
      setCancelProblem(bookingProblem(e).message);
    },
  });

  const hero = (
    <PageHero>
      <HeroBackLink to="/tickets">My tickets</HeroBackLink>
      <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Your ticket</h1>
      {ticketId && <p className="mt-1.5 text-sm opacity-90">Booking reference #{ticketId}</p>}
    </PageHero>
  );
  const shell = (body: React.ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="relative z-[5] mx-auto -mt-[42px] max-w-xl px-3 pb-16 min-[360px]:px-4 md:px-6">{body}</div>
    </SiteLayout>
  );

  if (ticketId === null || ticketQuery.isError) {
    const p = ticketId === null ? NOT_A_TICKET : ticketsProblem(ticketQuery.error);
    return shell(
      <Notice
        role="alert"
        icon={p.retryable ? <AlertTriangle className="h-6 w-6" /> : <SearchX className="h-6 w-6" />}
        title={p.title}
        actions={
          p.retryable ? (
            <button type="button" onClick={() => ticketQuery.refetch()} className={noticePrimary}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Try again
            </button>
          ) : (
            <Link to="/tickets" className={noticePrimary}>My tickets</Link>
          )
        }
      >
        {p.body}
      </Notice>,
    );
  }
  if (!ticket) {
    return shell(<div role="status" aria-busy aria-label="Loading your ticket" className="h-[420px] animate-pulse rounded-2xl border border-border bg-card" />);
  }

  const info = statusInfo(ticket.bookingStatus);
  const tripCancelled = trip?.status?.toLowerCase() === "cancelled";
  const qr = showsQr(ticket.bookingStatus)
    ? qrPayload({
        ticketId: ticket.ticketId,
        passengerName: user?.fullName,
        startStation: from ?? ticket.startLocationId,
        endStation: to ?? ticket.endLocationId,
        seatNumber: ticket.seatNumber,
        passengerCount: ticket.passengerCount,
        fareAmount: ticket.fareAmount,
        bookingStatus: ticket.bookingStatus,
        tripDate: trip?.tripDate,
        departureTime: trip?.scheduledDepartureTime,
        busPlateNumber: trip?.busPlateNumber,
      })
    : null;

  return shell(
    <>
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-float print:border-2 print:shadow-none">
        <header className="bg-gradient-primary p-4 text-white md:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Ticket className="h-4 w-4" aria-hidden />
              BusMate ticket
            </span>
            <StatusBadge status={ticket.bookingStatus} className="border-transparent" />
          </div>
          <p className="mt-3 text-[22px] font-extrabold leading-tight">
            {from && to ? (
              <>
                {shortStopName(from)} <span className="opacity-70">→</span> {shortStopName(to)}
              </>
            ) : (
              "Your trip"
            )}
          </p>
          {(trip?.routeName || trip?.operatorName) && <p className="mt-1 text-[13px] opacity-90">{[trip?.routeName, trip?.operatorName].filter(Boolean).join(" · ")}</p>}
        </header>

        <div className="grid gap-5 p-4 md:p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            {date && (
              <Fact icon={<CalendarDays className="h-4 w-4" />} label="Travel date">
                {formatLongDate(date)}
              </Fact>
            )}
            {dep != null && (
              <Fact icon={<Clock className="h-4 w-4" />} label="Leaves">
                <span className="flex flex-wrap items-center gap-1.5">
                  {formatClock(dep)}
                  <TrustChip trust={js?.departureTimeTrust} />
                </span>
              </Fact>
            )}
            <Fact icon={<Armchair className="h-4 w-4" />} label="Seat">
              {ticket.seatNumber ?? "—"}
            </Fact>
            {(trip?.busPlateNumber || ticket.busId) && (
              <Fact icon={<Bus className="h-4 w-4" />} label="Bus">
                {trip?.busPlateNumber ?? "—"}
              </Fact>
            )}
            {user?.fullName && (
              <Fact icon={<User className="h-4 w-4" />} label="Passenger">
                {user.fullName}
              </Fact>
            )}
          </dl>

          {/* A tear line, as on a paper ticket. */}
          <div className="relative -mx-4 md:-mx-5" aria-hidden>
            <div className="border-t border-dashed border-border" />
            <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-border bg-background" />
            <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-border bg-background" />
          </div>

          {qr ? <TicketQr value={qr} /> : <p className="text-center text-[13px] leading-relaxed text-muted-foreground">A boarding QR code appears here once this booking is confirmed.</p>}

          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Fare</span>
            <span className="text-xl font-extrabold">{formatMoney(ticket.fareAmount ?? 0)}</span>
          </div>
          {ticket.issuedAt && <p className="-mt-3 text-xs text-muted-foreground">Booked {new Date(ticket.issuedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>}
        </div>
      </article>

      <div className="mt-4 grid gap-3 print:hidden">
        {cancelled && (
          <p role="status" className="flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900 dark:border-green-400/30 dark:bg-green-500/10 dark:text-green-200">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
            Booking cancelled. The seat has been released.
          </p>
        )}
        {tripCancelled && !cancelled && (
          <p role="note" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <Ban className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
            The operator has cancelled this trip.
          </p>
        )}
        {info.meaning && !cancelled && <p className="rounded-2xl border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground">{info.meaning}</p>}
        {cancelProblem && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
            {cancelProblem}
          </p>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary px-6 text-[15px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Print or save
        </button>

        {canCancel(ticket.bookingStatus) && (
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-red-300 px-6 text-[15px] font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Cancel this booking
          </button>
        )}

        {(ticket.bookingStatus === "CONFIRMED" || ticket.bookingStatus === "BOARDED") && !tripCancelled && (
          <div className="rounded-2xl border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground">
            A confirmed ticket can't be cancelled here. To change or cancel it, contact the operator.
            {operatorPhone && (
              <a href={`tel:${operatorPhone}`} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Phone className="h-4 w-4" aria-hidden />
                Call {operatorPhone}
              </a>
            )}
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent variant="sheet">
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>Seat {ticket.seatNumber} will be released for other passengers. This can't be undone.</DialogDescription>
          <div className="grid gap-2">
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Yes, cancel it
            </button>
            <DialogClose className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-border px-6 text-sm font-bold hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Keep my booking
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>,
  );
}
