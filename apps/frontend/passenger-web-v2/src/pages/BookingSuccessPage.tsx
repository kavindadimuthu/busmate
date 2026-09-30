import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, SearchX, Ticket } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import TripSummary from "@/components/booking/TripSummary";
import FareSummary from "@/components/booking/FareSummary";
import { useBooking } from "@/lib/booking/BookingContext";
import { paymentMode } from "@/lib/booking/payment.ts";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SECONDARY =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary px-6 text-[15px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** The booking is done. Says so, and says plainly when no money was taken because payments aren't on yet. */
export default function BookingSuccessPage() {
  const navigate = useNavigate();
  const { trip, seats, result, clear } = useBooking();

  const hero = (
    <PageHero>
      <h1 className="mt-4 flex items-center gap-2.5 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        <CheckCircle2 className="h-8 w-8 flex-none text-green-300" aria-hidden />
        Booking confirmed
      </h1>
    </PageHero>
  );

  if (!trip || !result) {
    return (
      <SiteLayout>
        <PageHero>
          <h1 className="mt-4 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Your booking</h1>
        </PageHero>
        <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 pb-16 min-[360px]:px-4 md:px-6">
          <Notice role="status" icon={<SearchX className="h-6 w-6" />} title="No booking to show" actions={<Link to="/tickets" className={noticePrimary}>My tickets</Link>}>
            Your tickets list has every booking you've made.
          </Notice>
        </div>
      </SiteLayout>
    );
  }

  const noMoney = paymentMode(result) === "dummy";
  const go = (to: string) => {
    clear();
    navigate(to);
  };

  return (
    <SiteLayout>
      {hero}
      <div className="relative z-[5] mx-auto -mt-[44px] max-w-xl px-3 pb-16 min-[360px]:px-4 md:px-6">
        <TripSummary trip={trip} />
        <div className="mt-4">
          <FareSummary seats={seats} result={result} />
        </div>

        <section aria-label="Ticket numbers" className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm md:p-5">
          <h2 className="text-[15px] font-extrabold">{result.ticketIds.length === 1 ? "Ticket number" : "Ticket numbers"}</h2>
          <p className="mt-2 text-muted-foreground">
            {result.ticketIds.map((id, i) => `#${id} (seat ${seats[i] ?? "?"})`).join(" · ")}
          </p>
        </section>

        {noMoney && (
          <p role="note" className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-[13px] leading-relaxed text-blue-950 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100">
            <strong>No money was taken.</strong> Payments aren't switched on yet, so this booking wasn't charged.
          </p>
        )}

        <div className="mt-5 grid gap-2.5">
          <button type="button" onClick={() => go("/tickets")} className={CTA}>
            <Ticket className="h-4 w-4" aria-hidden />
            View my tickets
          </button>
          <button type="button" onClick={() => go("/findmybus")} className={SECONDARY}>
            Find another bus
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}
