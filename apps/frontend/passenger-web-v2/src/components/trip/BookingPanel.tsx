import { Link } from "react-router-dom";
import { Armchair, Ban, CalendarX, Clock, Ticket } from "lucide-react";
import type { BookingState } from "@/lib/tripDetails.ts";
import { cn } from "@/lib/utils";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const CLOSED: Record<Exclude<BookingState["kind"], "open">, { icon: typeof Ban; title: string; body: string }> = {
  "no-bus": {
    icon: Armchair,
    title: "Online booking isn't open for this departure",
    body: "No bus has been assigned to it yet, so there are no seats to reserve. The times above come from the timetable.",
  },
  cancelled: { icon: Ban, title: "This trip has been cancelled", body: "It can't be booked. Search again for another bus." },
  left: { icon: Clock, title: "This bus has already left", body: "It can't be booked any more. Search again for a later bus." },
  "past-date": { icon: CalendarX, title: "This date has passed", body: "Choose a date from today onwards to book seats." },
};

/** What a passenger can do about booking, stated plainly: a button when a bus is assigned and the trip can still
 * be booked, otherwise the reason it can't. The fare isn't shown: the search has no price, and the server
 * works it out when the seats are reserved. */
export default function BookingPanel({ state, seatsHref, className }: { state: BookingState; seatsHref?: string; className?: string }) {
  if (state.kind === "open" && seatsHref) {
    return (
      <section aria-label="Booking" className={cn("rounded-2xl border border-border bg-card p-4 md:p-5", className)}>
        <div className="flex items-center gap-2 text-[15px] font-extrabold">
          <Ticket className="h-5 w-5 text-primary" aria-hidden />
          Book this bus
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Choose your seats next. The fare is worked out and shown when you reserve them.
        </p>
        <Link to={seatsHref} className={cn(CTA, "mt-3.5")}>
          Choose seats →
        </Link>
      </section>
    );
  }

  const closed = CLOSED[state.kind === "open" ? "no-bus" : state.kind];
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
export function StickyBookBar({ seatsHref }: { seatsHref: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
      <Link to={seatsHref} className={CTA}>
        Choose seats →
      </Link>
    </div>
  );
}
