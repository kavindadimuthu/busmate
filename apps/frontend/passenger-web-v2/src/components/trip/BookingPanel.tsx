import { Link } from "react-router-dom";
import { Armchair, Ban, CalendarX, Clock, Lock, Ticket } from "lucide-react";
import type { FareQuoteDTO } from "@busmate/api-client-ticketing";
import type { BookingState } from "@/lib/tripDetails.ts";
import { formatMoney } from "@/lib/booking/payment.ts";
import { cn } from "@/lib/utils";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const CLOSED: Record<Exclude<BookingState["kind"], "open"> | "paused", { icon: typeof Ban; title: string; body: string }> = {
  "no-bus": {
    icon: Armchair,
    title: "Online booking isn't open for this departure",
    body: "No bus has been assigned to it yet, so there are no seats to reserve. The times above come from the timetable.",
  },
  cancelled: { icon: Ban, title: "This trip has been cancelled", body: "It can't be booked. Search again for another bus." },
  left: { icon: Clock, title: "This bus has already left", body: "It can't be booked any more. Search again for a later bus." },
  // Online booking is switched off for everyone (INC-072): not about this bus at all.
  paused: {
    icon: Lock,
    title: "Online booking isn't open yet",
    body: "You can still see when this bus runs and who runs it. Seats can't be reserved online yet.",
  },
  "past-date": { icon: CalendarX, title: "This date has passed", body: "Choose a date from today onwards to book seats." },
};

/** What a passenger can do about booking, stated plainly: a button when a bus is assigned and the trip can still
 * be booked, otherwise the reason it can't. The fare is the server's quote for this journey (INC-073); if it can't
 * be had, the panel says the fare comes when seats are reserved rather than guess. */
export default function BookingPanel({
  state,
  seatsHref,
  paused = false,
  quote,
  className,
}: {
  state: BookingState;
  seatsHref?: string;
  paused?: boolean;
  quote?: FareQuoteDTO;
  className?: string;
}) {
  if (state.kind === "open" && seatsHref && !paused) {
    return (
      <section aria-label="Booking" className={cn("rounded-2xl border border-border bg-card p-4 md:p-5", className)}>
        <div className="flex items-center gap-2 text-[15px] font-extrabold">
          <Ticket className="h-5 w-5 text-primary" aria-hidden />
          Book this bus
        </div>
        {quote?.farePerSeat != null ? (
          <>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight">{formatMoney(quote.farePerSeat)}</span>
              <span className="text-sm text-muted-foreground">per seat</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              For your stops. Choose your seats next; the fare is confirmed when you reserve them, and you'll see it before you pay.
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">Choose your seats next. The fare is worked out and shown when you reserve them.</p>
        )}
        <Link to={seatsHref} className={cn(CTA, "mt-3.5")}>
          Choose seats →
        </Link>
      </section>
    );
  }

  const closed = CLOSED[state.kind === "open" ? (paused ? "paused" : "no-bus") : state.kind];
  const Icon = closed.icon;
  return (
    <section aria-label="Booking" className={cn("rounded-2xl border border-dashed border-border bg-card p-4 md:p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-tint text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold leading-snug">{closed.title}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{closed.body}</p>
        </div>
      </div>
    </section>
  );
}

/** A phone's thumb-reach booking button, fixed to the bottom edge. Only when booking is open. */
export function StickyBookBar({ seatsHref, quote }: { seatsHref: string; quote?: FareQuoteDTO }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3">
        {quote?.farePerSeat != null && (
          <p className="min-w-0 flex-none text-sm leading-tight">
            <span className="block font-extrabold">{formatMoney(quote.farePerSeat)}</span>
            <span className="block text-xs text-muted-foreground">per seat</span>
          </p>
        )}
        <Link to={seatsHref} className={CTA}>
          Choose seats →
        </Link>
      </div>
    </div>
  );
}
