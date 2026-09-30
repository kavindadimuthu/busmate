import { useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, SearchX } from "lucide-react";
import { TicketControllerService } from "@busmate/api-client-ticketing";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary, noticeSecondary } from "@/components/findmybus/noticeStyles";
import { useBooking } from "@/lib/booking/BookingContext";
import { SETTLE_MAX_POLLS, SETTLE_POLL_MS, settlement, ticketIdFromOrderId } from "@/lib/booking/payment.ts";

/** Where PayHere sends the passenger back after they pay (ADR-014). PayHere's own page has already shown them the
 * result; this page waits for PayHere's message to reach BusMate's server, which is what actually settles the
 * booking. The return is a full page load, so nothing from the booking pages survives: the ticket comes from
 * `order_id` (`TICKET-<id>`), which the server put there. */
export default function PayHereReturnPage() {
  const [params] = useSearchParams();
  const { clear } = useBooking();
  const orderId = params.get("order_id");
  const ticketId = useMemo(() => ticketIdFromOrderId(orderId), [orderId]);

  const polls = useRef(0);
  const check = useQuery({
    queryKey: ["payhere-settle", ticketId],
    enabled: ticketId !== null,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () => {
      polls.current += 1;
      return TicketControllerService.confirmPayment(ticketId!);
    },
    refetchInterval: (q) => {
      const s = settlement(q.state.data?.paymentStatus, polls.current, !!q.state.error);
      return s === "waiting" ? SETTLE_POLL_MS : false;
    },
  });

  // An unchanged answer ("still pending") doesn't re-render by itself, so subscribe to each check starting and
  // finishing: otherwise the count below is never read again and a payment that never settles would wait forever.
  void check.fetchStatus;
  const state = ticketId === null ? null : settlement(check.data?.paymentStatus, polls.current, !!check.error);

  const hero = (
    <PageHero>
      <h1 className="mt-4 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Your payment</h1>
    </PageHero>
  );
  const shell = (body: React.ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="relative z-[5] mx-auto -mt-[42px] max-w-xl px-3 pb-16 min-[360px]:px-4 md:px-6">{body}</div>
    </SiteLayout>
  );

  if (state === null) {
    return shell(
      <Notice role="status" icon={<SearchX className="h-6 w-6" />} title="There's no payment to check here" actions={<Link to="/tickets" className={noticePrimary}>My tickets</Link>}>
        Your tickets list shows the real state of every booking.
      </Notice>,
    );
  }
  if (state === "waiting") {
    return shell(
      <Notice role="status" icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Confirming your payment with PayHere…">
        This usually takes a few seconds. Please keep this page open.
        {orderId && <span className="mt-1 block text-xs">Order {orderId}</span>}
      </Notice>,
    );
  }
  if (state === "paid") {
    return shell(
      <Notice role="status" icon={<CheckCircle2 className="h-6 w-6" />} title="Payment confirmed" actions={<Link to="/tickets" onClick={clear} className={noticePrimary}>View my tickets</Link>}>
        Your seats are booked.
      </Notice>,
    );
  }
  return shell(
    <Notice
      role="alert"
      icon={<AlertTriangle className="h-6 w-6" />}
      title={state === "slow" ? "Still waiting for PayHere" : "We couldn't confirm the payment"}
      actions={
        <>
          <Link to="/tickets" onClick={clear} className={noticePrimary}>View my tickets</Link>
          {state === "slow" && (
            <button type="button" onClick={() => { polls.current = 0; check.refetch(); }} className={noticeSecondary}>
              Check again
            </button>
          )}
        </>
      }
    >
      {state === "slow"
        ? `We waited about ${Math.round((SETTLE_MAX_POLLS * SETTLE_POLL_MS) / 1000)} seconds and PayHere hasn't confirmed it yet. Your tickets list will show the real status as soon as it does.`
        : "Your tickets list shows the real status of this booking. If you were charged and it says otherwise, contact BusMate."}
    </Notice>,
  );
}
