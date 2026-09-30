import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Armchair, RefreshCw, SearchX } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackButton, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import SeatMap from "@/components/booking/SeatMap";
import BookingSteps from "@/components/booking/BookingSteps";
import TripSummary from "@/components/booking/TripSummary";
import { useBooking, type BookingTrip } from "@/lib/booking/BookingContext";
import { useSeatMapData } from "@/lib/booking/bookingApi";
import { MAX_SEATS_PER_BOOKING, dropUnavailable, sortSeats, toggleSeat } from "@/lib/booking/seatMap.ts";
import { cn } from "@/lib/utils";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

function readTrip(q: URLSearchParams): BookingTrip | null {
  const tripId = q.get("tripId");
  const busId = q.get("busId");
  const fromStopId = q.get("fromStopId");
  const toStopId = q.get("toStopId");
  if (!tripId || !busId || !fromStopId || !toStopId) return null;
  return {
    tripId,
    busId,
    fromStopId,
    toStopId,
    fromStopName: q.get("fromStopName") ?? "",
    toStopName: q.get("toStopName") ?? "",
    routeName: q.get("routeName") ?? undefined,
    operatorName: q.get("operatorName") ?? undefined,
    tripDate: q.get("tripDate") ?? undefined,
    departureTime: q.get("departureTime") ?? undefined,
    departureTrust: q.get("departureTrust") ?? undefined,
    arrivalTime: q.get("arrivalTime") ?? undefined,
  };
}

const plural = (n: number) => `${n} seat${n === 1 ? "" : "s"}`;

/** Step 1 of booking: choose seats from the bus's real layout, with real availability. */
export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { trip: saved, seats: savedSeats, start } = useBooking();
  const fromLink = useMemo(() => readTrip(params), [params]);
  const map = useSeatMapData(fromLink?.tripId ?? "", fromLink?.busId ?? "", !!fromLink);

  // Coming back from the review step keeps what was chosen for this same trip.
  const [picked, setPicked] = useState<string[]>(() => (saved && fromLink && saved.tripId === fromLink.tripId ? savedSeats : []));
  const [note, setNote] = useState<string | null>(null);
  const noteTimer = useRef<number>();
  const say = (text: string) => {
    setNote(text);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 6000);
  };
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const blocked = useMemo(() => new Set((map.layout?.blockedSeats ?? []).map(String)), [map.layout]);

  // Someone else can take a seat while this passenger is looking at it: drop it from the choice and say so.
  useEffect(() => {
    const { selected, dropped } = dropUnavailable(picked, map.taken, blocked);
    if (dropped.length === 0) return;
    setPicked(selected);
    say(`${dropped.length === 1 ? `Seat ${dropped[0]} was` : `Seats ${dropped.join(", ")} were`} just taken, so we've removed ${dropped.length === 1 ? "it" : "them"} from your choice.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, map.taken, blocked]);

  const onPick = (seat: string) => {
    const r = toggleSeat(picked, seat, map.taken, blocked);
    setPicked(r.selected);
    if (r.refused === "limit") say(`You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`);
    else if (r.refused === "unavailable") say(`Seat ${seat} isn't available.`);
    else setNote(null);
  };

  const ordered = sortSeats(picked);
  const cont = () => {
    if (!fromLink || picked.length === 0) return;
    start({ ...fromLink, busPlateNumber: map.bus?.plateNumber }, ordered);
    navigate("/booking/review");
  };

  const hero = (
    <PageHero>
      <HeroBackButton onClick={() => navigate(-1)}>Bus details</HeroBackButton>
      <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Choose your seats</h1>
      <div className="mt-3">
        <BookingSteps current={1} onDark />
      </div>
    </PageHero>
  );

  // ---------- no usable link, loading, or failed ----------
  if (!fromLink || map.isPending || map.error || map.noLayout) {
    return (
      <SiteLayout>
        {hero}
        <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 pb-16 min-[360px]:px-4 md:px-6">
          {!fromLink ? (
            <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title="That link is missing something" actions={<Link to="/findmybus" className={noticePrimary}>Search for a bus</Link>}>
              Start from a bus's details page and choose "Choose seats".
            </Notice>
          ) : map.isPending ? (
            <div role="status" aria-busy aria-label="Loading seats" className="grid gap-4">
              <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
              <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-card" />
            </div>
          ) : map.error ? (
            <Notice
              role="alert"
              icon={<AlertTriangle className="h-6 w-6" />}
              title="We couldn't load the seats"
              actions={
                <button type="button" onClick={() => map.refetch()} className={noticePrimary}>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                  Try again
                </button>
              }
            >
              Check your connection and try again.
            </Notice>
          ) : (
            <Notice role="alert" icon={<Armchair className="h-6 w-6" />} title="We can't show seats for this bus" actions={<button type="button" onClick={() => navigate(-1)} className={noticePrimary}>Go back</button>}>
              This bus has no seat plan on record, so seats can't be chosen online yet.
            </Notice>
          )}
        </div>
      </SiteLayout>
    );
  }

  const layout = map.layout!;
  const summaryTrip = { ...fromLink, busPlateNumber: map.bus?.plateNumber };
  const free = map.seatCount - blocked.size - [...map.taken].filter((s) => !blocked.has(s)).length;

  return (
    <SiteLayout>
      {hero}
      <div className={cn("relative z-[5] mx-auto -mt-[44px] max-w-[1240px] px-3 pb-28 min-[360px]:px-4 md:px-6 lg:pb-16")}>
        <TripSummary trip={summaryTrip} />

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-7">
          <section aria-label="Seat map" className="rounded-2xl border border-border bg-card p-4 md:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-extrabold">Pick up to {MAX_SEATS_PER_BOOKING} seats</h2>
              <span className="text-xs text-muted-foreground">{free} free</span>
            </div>
            <div className="mx-auto max-w-sm">
              <SeatMap layout={layout} taken={map.taken} selected={picked} onPick={onPick} />
            </div>
            <p role="status" aria-live="polite" className={cn("mt-4 min-h-5 text-center text-[13px] font-semibold text-primary", !note && "sr-only")}>
              {note}
            </p>
          </section>

          {/* From lg: the choice and the button sit beside the map. On a phone the bottom bar does this job. */}
          <aside aria-label="Your choice" className="hidden rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:block">
            <h2 className="text-[15px] font-extrabold">Your seats</h2>
            <p className="mt-2 text-sm text-muted-foreground">{picked.length === 0 ? "Choose a seat on the map." : `${plural(picked.length)}: ${ordered.join(", ")}`}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">You'll see the fare when you reserve, before you pay.</p>
            <button type="button" disabled={picked.length === 0} onClick={cont} className={cn(CTA, "mt-4")}>
              Continue →
            </button>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3">
          <p className="min-w-0 flex-1 text-sm leading-tight">
            {picked.length === 0 ? (
              <span className="text-muted-foreground">Choose a seat</span>
            ) : (
              <>
                <span className="block font-bold">{plural(picked.length)}</span>
                <span className="block truncate text-xs text-muted-foreground">{ordered.join(", ")}</span>
              </>
            )}
          </p>
          <button type="button" disabled={picked.length === 0} onClick={cont} className={cn(CTA, "w-auto flex-none")}>
            Continue →
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}
