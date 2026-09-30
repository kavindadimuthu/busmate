import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, Info, Loader2, SearchX } from "lucide-react";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import BookingSteps from "@/components/booking/BookingSteps";
import TripSummary from "@/components/booking/TripSummary";
import FareSummary from "@/components/booking/FareSummary";
import { useBooking } from "@/lib/booking/BookingContext";
import { bookingProblem } from "@/lib/booking/bookingApi";
import { formatMoney, paymentMode } from "@/lib/booking/payment.ts";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuthRouteState } from "@/lib/auth/redirect";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const BAR =
  "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none";

/** Step 3 of booking: the seats are held; show what they cost and complete the booking. Which of the two ways it
 * completes is the server's call (see paymentMode), and the wording says plainly which one this is. */
export default function PaymentPage() {
  const navigate = useNavigate();
  const { trip, seats, result } = useBooking();
  const { logout } = useAuth();
  const [problem, setProblem] = useState<{ message: string; signedOut: boolean } | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Confirming any one ticket settles the whole booking: they share one payment.
  const confirm = useMutation({
    mutationFn: () => TicketControllerService.confirmPayment(result!.ticketIds[0]),
    onSuccess: (r) => {
      if (r.paymentStatus === "SUCCESS" || r.confirmed) navigate("/booking/success", { replace: true });
      else setProblem({ message: "The payment didn't go through. Your seats are still held for a short time, so you can try again.", signedOut: false });
    },
    onError: async (e) => {
      const p = bookingProblem(e);
      setProblem(p);
      if (p.signedOut) {
        await logout();
        const state: AuthRouteState = { from: "/booking/payment", notice: "Your session ended. Log in to finish booking." };
        navigate("/login", { state });
      }
    },
  });

  const hero = (
    <PageHero>
      <HeroBackLink to="/findmybus">Find My Bus</HeroBackLink>
      <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Complete your booking</h1>
      <div className="mt-3">
        <BookingSteps current={3} onDark />
      </div>
    </PageHero>
  );

  if (!trip || !result || result.ticketIds.length === 0) {
    return (
      <SiteLayout>
        {hero}
        <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 pb-16 min-[360px]:px-4 md:px-6">
          <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title="There's nothing to pay for here" actions={<Link to="/findmybus" className={noticePrimary}>Search for a bus</Link>}>
            Reserve seats first, then come back to this step.
          </Notice>
        </div>
      </SiteLayout>
    );
  }

  const mode = paymentMode(result);
  const busy = confirm.isPending || leaving;

  return (
    <SiteLayout>
      {hero}
      <div className="relative z-[5] mx-auto -mt-[44px] max-w-xl px-3 pb-32 min-[360px]:px-4 md:px-6 lg:pb-16">
        <TripSummary trip={trip} />
        <div className="mt-4">
          <FareSummary seats={seats} result={result} />
        </div>

        <div role="note" className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-[13px] leading-relaxed text-blue-950 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100">
          <Info className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
          {mode === "dummy" ? (
            <p>
              <strong>Payments aren't switched on yet, so no money will be taken.</strong> Confirming books your seats. Your seats are held for a short time; confirm before they're released.
            </p>
          ) : (
            <p>
              You'll go to PayHere, BusMate's payment provider, to pay. Your seats are held for a short time while you pay; if you don't finish, they're released.
            </p>
          )}
        </div>

        {problem && !problem.signedOut && (
          <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
            <div>
              <p className="font-bold">{problem.message}</p>
              <Link to="/findmybus" className="mt-1 inline-flex min-h-10 items-center font-semibold underline">
                Search again
              </Link>
            </div>
          </div>
        )}

        {/* On a phone the button lives in a bar at the bottom edge, where a thumb reaches it; from lg it sits in the page. */}
        <div className={BAR}>
          <p className="mb-2 text-center text-xs font-semibold text-muted-foreground lg:hidden">
            {mode === "dummy" ? "Payments aren't switched on yet. No money is taken." : "You'll pay on PayHere's secure page."}
          </p>
        {mode === "dummy" ? (
          <button type="button" disabled={busy} onClick={() => { setProblem(null); confirm.mutate(); }} className={CTA}>
            {confirm.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirm.isPending ? "Confirming…" : "Confirm booking"}
          </button>
        ) : (
          // A real form post, so the browser leaves for PayHere the way a checkout should, and only when tapped.
          <form method="POST" action={result.redirectUrl!} onSubmit={() => setLeaving(true)}>
            {Object.entries(result.checkoutFields!).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button type="submit" disabled={busy} className={CTA}>
              {leaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
              {leaving ? "Opening PayHere…" : `Pay ${formatMoney(result.fareAmount)} with PayHere`}
            </button>
          </form>
        )}
        </div>
      </div>
    </SiteLayout>
  );
}
