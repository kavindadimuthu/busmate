import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Armchair, Loader2, SearchX } from "lucide-react";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import BookingSteps from "@/components/booking/BookingSteps";
import TripSummary from "@/components/booking/TripSummary";
import { useBooking } from "@/lib/booking/BookingContext";
import { bookingProblem } from "@/lib/booking/bookingApi";
import { seatsPath } from "@/lib/tripDetails.ts";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuthRouteState } from "@/lib/auth/redirect";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Step 2 of booking: check the trip and seats, then reserve them. The fare is worked out by the server when the
 * seats are reserved, so it isn't shown here; the next step shows it before anything is paid. */
export default function BookingReviewPage() {
  const navigate = useNavigate();
  const { trip, seats, result, setResult } = useBooking();
  const { logout } = useAuth();
  const [problem, setProblem] = useState<{ message: string; signedOut: boolean } | null>(null);

  const reserve = useMutation({
    mutationFn: () =>
      TicketControllerService.bookTicket({ tripId: trip!.tripId, startLocationId: trip!.fromStopId, endLocationId: trip!.toStopId, seatNumbers: seats }),
    onSuccess: (r) => {
      setResult({
        ticketIds: r.ticketIds ?? (r.ticketId ? [r.ticketId] : []),
        farePerSeat: r.farePerSeat ?? 0,
        fareAmount: r.fareAmount ?? 0,
        paymentReference: r.paymentReference ?? "",
        redirectUrl: r.redirectUrl,
        checkoutFields: r.checkoutFields,
      });
      navigate("/booking/payment");
    },
    onError: async (e) => {
      const p = bookingProblem(e);
      setProblem(p);
      if (p.signedOut) {
        // The server no longer accepts this session, so end it here too; otherwise the login page would think
        // the passenger is still signed in and send them straight back.
        await logout();
        const state: AuthRouteState = { from: "/booking/review", notice: "Your session ended. Log in to finish booking." };
        navigate("/login", { state });
      }
    },
  });

  const hero = (
    <PageHero>
      <HeroBackLink to={trip ? seatsPath({ ...trip, tripId: trip.tripId }) : "/findmybus"}>Change seats</HeroBackLink>
      <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Review your booking</h1>
      <div className="mt-3">
        <BookingSteps current={2} onDark />
      </div>
    </PageHero>
  );

  if (!trip || seats.length === 0) {
    return (
      <SiteLayout>
        {hero}
        <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 pb-16 min-[360px]:px-4 md:px-6">
          <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title="We've lost track of your seats" actions={<Link to="/findmybus" className={noticePrimary}>Search for a bus</Link>}>
            Your seat choice isn't saved any more. Open the bus again and choose your seats.
          </Notice>
        </div>
      </SiteLayout>
    );
  }

  const reserved = !!result;
  return (
    <SiteLayout>
      {hero}
      <div className="relative z-[5] mx-auto -mt-[44px] max-w-xl px-3 pb-16 min-[360px]:px-4 md:px-6">
        <TripSummary trip={trip} />

        <section aria-label="Your seats" className="mt-4 rounded-2xl border border-border bg-card p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
            <Armchair className="h-5 w-5 text-primary" aria-hidden />
            {seats.length === 1 ? "Your seat" : `Your ${seats.length} seats`}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {seats.map((s) => (
              <li key={s} className="grid h-11 min-w-11 place-items-center rounded-lg border-[1.5px] border-primary bg-tint px-3 text-sm font-bold text-primary">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            {reserved
              ? "These seats are already reserved for you. Carry on to payment."
              : "Reserving holds these seats for you for a short time while you pay. The fare is worked out when you reserve, and you'll see it before you pay anything."}
          </p>
        </section>

        {problem && !problem.signedOut && (
          <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
            <div>
              <p className="font-bold">{problem.message}</p>
              <Link to={seatsPath({ ...trip })} className="mt-1 inline-flex min-h-10 items-center font-semibold underline">
                Choose other seats
              </Link>
            </div>
          </div>
        )}

        {reserved ? (
          <Link to="/booking/payment" className={`${CTA} mt-5`}>
            Continue to payment →
          </Link>
        ) : (
          <button type="button" disabled={reserve.isPending} onClick={() => { setProblem(null); reserve.mutate(); }} className={`${CTA} mt-5`}>
            {reserve.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {reserve.isPending ? "Reserving…" : "Reserve seats"}
          </button>
        )}
      </div>
    </SiteLayout>
  );
}
