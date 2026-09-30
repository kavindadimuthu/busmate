import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, SearchX } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import JourneyCard from "@/components/trip/JourneyCard";
import StopTimeline from "@/components/trip/StopTimeline";
import BookingPanel, { StickyBookBar } from "@/components/trip/BookingPanel";
import BusAndOperator from "@/components/trip/BusAndOperator";
import TimetableFacts, { RouteFacts } from "@/components/trip/TimetableFacts";
import OtherDepartures from "@/components/trip/OtherDepartures";
import ReportProblem from "@/components/trip/ReportProblem";
import ShareButton from "@/components/trip/ShareButton";
import MapDisclosure from "@/components/map/MapDisclosure";
import { tripPoints } from "@/lib/routeMap.ts";
import { requestProblem, responseProblem, useTripDetails } from "@/lib/tripDetailsApi";
import { useFareQuote, useOnlineBookingOpen } from "@/lib/booking/bookingApi";
import { bookingState, hasRequiredParams, readDetailParams, resultsPath, seatsPath, stopRows, visibleRows } from "@/lib/tripDetails.ts";
import { formatClock, formatLongDate, parseTimeOfDay, shortStopName } from "@/lib/findMyBus.ts";
import { todayInSriLanka } from "@/lib/search";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import { cn } from "@/lib/utils";

export default function TripDetailsPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const today = todayInSriLanka();
  const params = useMemo(() => readDetailParams(search, today), [search, today]);
  const valid = hasRequiredParams(params);
  const query = useTripDetails(params, valid);
  const data = query.data;
  const problem = query.isError ? requestProblem(query.error) : responseProblem(data);
  const ready = !!data && !problem;

  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [params.scheduleId, params.tripId, params.date]);

  const js = data?.journeySummary;
  const fromName = js?.originStop?.name ?? "";
  const toName = js?.destinationStop?.name ?? "";
  const back = resultsPath({ fromStopId: params.fromStopId, toStopId: params.toStopId, fromName, toName, date: params.date });

  useEffect(() => {
    const dep = parseTimeOfDay(js?.departureFromOrigin);
    document.title = ready ? `${shortStopName(fromName)} → ${shortStopName(toName)}${dep != null ? ` · ${formatClock(dep)}` : ""} · BusMate` : "Bus details · BusMate";
  }, [ready, js, fromName, toName]);

  const rows = useMemo(
    () => stopRows(data?.routeScheduleStops, { originOrder: js?.originStopOrder, destinationOrder: js?.destinationStopOrder, fromStopId: params.fromStopId, toStopId: params.toStopId }),
    [data, js, params.fromStopId, params.toStopId],
  );
  const mapData = useMemo(() => tripPoints(rows), [rows]);
  const shown = visibleRows(rows, showAll);
  const hiddenCount = rows.length - visibleRows(rows, false).length;

  const state = ready ? bookingState(data, params.date, today) : null;
  // Switched off for everyone: say so, and offer no way in. Unknown (still loading, or unreachable) is treated as open.
  const paused = useOnlineBookingOpen() === false;
  const quote = useFareQuote({
    tripId: state?.kind === "open" ? state.tripId : undefined,
    fromStopId: js?.originStop?.id ?? params.fromStopId,
    toStopId: js?.destinationStop?.id ?? params.toStopId,
    seats: 1,
    enabled: !paused,
  });
  const seatsHref =
    state?.kind === "open" && !paused
      ? seatsPath({
          tripId: state.tripId,
          busId: state.busId,
          fromStopId: js?.originStop?.id ?? params.fromStopId,
          toStopId: js?.destinationStop?.id ?? params.toStopId,
          fromStopName: fromName,
          toStopName: toName,
          routeName: data?.route?.name,
          operatorName: data?.trip?.operator?.name,
          tripDate: data?.queryDate ?? params.date,
          departureTime: js?.departureFromOrigin,
          departureTrust: js?.departureTimeTrust?.label,
          arrivalTime: js?.arrivalAtDestination,
        })
      : undefined;

  // ---------- not a usable link, loading, or failed ----------
  if (!valid || problem || query.isPending) {
    return (
      <SiteLayout>
        <PageHero>
          <HeroBackLink to={valid ? back : "/findmybus"}>Search results</HeroBackLink>
          <h1 className="mt-1 text-[clamp(22px,6vw,40px)] font-extrabold leading-tight tracking-[-0.03em]">Bus details</h1>
        </PageHero>
        <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 pb-16 min-[360px]:px-4 md:px-6">
          {!valid ? (
            <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title="That link is missing something" actions={<Link to="/findmybus" className={noticePrimary}>Search for a bus</Link>}>
              Open a bus from your search results and it will work.
            </Notice>
          ) : problem ? (
            <Notice
              role="alert"
              icon={problem.retryable ? <AlertTriangle className="h-6 w-6" /> : <SearchX className="h-6 w-6" />}
              title={problem.title}
              actions={
                problem.retryable ? (
                  <button type="button" onClick={() => query.refetch()} className={noticePrimary}>
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                    Try again
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate(back)} className={noticePrimary}>
                    Back to results
                  </button>
                )
              }
            >
              {problem.body}
            </Notice>
          ) : (
            <div role="status" aria-busy aria-label="Loading bus details" className="grid gap-4">
              <div className="h-[170px] animate-pulse rounded-2xl border border-border bg-card" />
              <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
              <div className="h-[280px] animate-pulse rounded-2xl border border-border bg-card" />
            </div>
          )}
        </div>
      </SiteLayout>
    );
  }

  const d = data!;
  const route = d.route;
  return (
    <SiteLayout>
      <PageHero>
        <div className="flex items-center justify-between gap-3">
          <HeroBackLink to={back}>Search results</HeroBackLink>
          <ShareButton title={`${shortStopName(fromName)} → ${shortStopName(toName)}`} text={`Bus from ${shortStopName(fromName)} to ${shortStopName(toName)} on ${formatLongDate(params.date)}`} />
        </div>
        <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
          {shortStopName(fromName)} <span className="text-highlight">→</span> {shortStopName(toName)}
        </h1>
        <p className="mt-1.5 text-sm opacity-90">
          {[route?.routeNumber && `Route ${route.routeNumber}`, formatLongDate(d.queryDate ?? params.date)].filter(Boolean).join(" · ")}
        </p>
      </PageHero>

      <div className={cn("relative z-[5] mx-auto -mt-[44px] max-w-[1240px] px-3 min-[360px]:px-4 md:px-6", state?.kind === "open" ? "pb-28 lg:pb-16" : "pb-16")}>
        <JourneyCard data={d} date={params.date} />

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-7">
          {/* `contents` lets phones interleave both columns in one order; from lg they are two real columns. */}
          <div className="contents lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:grid lg:gap-4">
            {state && <BookingPanel state={state} seatsHref={seatsHref} paused={paused} quote={quote} className="order-1" />}
            <BusAndOperator trip={d.trip} usualWorkings={d.usualWorkings} scheduleId={params.scheduleId} className="order-3" />
            <OtherDepartures fromStopId={params.fromStopId} toStopId={params.toStopId} date={params.date} currentScheduleId={params.scheduleId} currentTripId={params.tripId} className="order-6" />
          </div>

          <div className="contents lg:col-start-1 lg:row-start-1 lg:grid lg:gap-4">
            <section aria-label="Stops" className="order-2 rounded-2xl lg:order-first border border-border bg-card p-4 md:p-5">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="text-[15px] font-extrabold">{showAll ? "Whole route" : "Your journey"}</h2>
                <span className="text-xs text-muted-foreground">
                  {shown.length} stop{shown.length === 1 ? "" : "s"}
                </span>
              </div>
              <StopTimeline rows={shown} />
              {(hiddenCount > 0 || showAll) && (
                <button
                  type="button"
                  aria-pressed={showAll}
                  onClick={() => setShowAll((s) => !s)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border-[1.5px] border-primary text-[13px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showAll ? "Show only my journey" : `Show the whole route (${hiddenCount} more stop${hiddenCount === 1 ? "" : "s"})`}
                </button>
              )}
            </section>
            <MapDisclosure title="Map" data={mapData} highlightJourney className="order-2" legend="Your journey is the bold line, from where you board (green) to where you get off (red). The line joins the stops in order; it isn't the road the bus takes." />
            <div className="order-4 grid gap-4 lg:contents">
              <TimetableFacts schedule={d.schedule} date={params.date} />
              <RouteFacts route={route} />
            </div>
            <div className="order-7">{params.scheduleId && <ReportProblem scheduleId={params.scheduleId} />}</div>
          </div>
        </div>
      </div>

      {seatsHref && <StickyBookBar seatsHref={seatsHref} quote={quote} />}
    </SiteLayout>
  );
}
