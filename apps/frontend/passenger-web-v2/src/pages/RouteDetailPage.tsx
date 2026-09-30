import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowRightLeft, Clock, Milestone, Navigation, RefreshCw, Route as RouteIcon, SearchX } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { TrustChip } from "@/components/trust/TrustChip";
import { TrustExplainer } from "@/components/trust/TrustExplainer";
import RouteStopList from "@/components/routes/RouteStopList";
import { isNotFound, useRoute, useRoutes, useRouteStops } from "@/lib/routesApi";
import { formatKm, orderedStops, otherDirections, roadTypeLabel } from "@/lib/routes.ts";
import { formatDuration, shortStopName } from "@/lib/findMyBus.ts";
import { findMyBusPath, todayInSriLanka } from "@/lib/search";
import { confirmedText } from "@/lib/trust";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const Fact = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 flex-none text-primary" aria-hidden>{icon}</span>
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  </div>
);

/** One route: where it goes, how far, its stops in order, and a way straight into looking for a bus on it. There is
 * no map yet and no timetable here: what runs on a route on a given day is what searching for a bus answers. */
export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const routeQuery = useRoute(id);
  const stopsQuery = useRouteStops(id);
  const all = useRoutes().data;
  const route = routeQuery.data;

  const stops = useMemo(() => orderedStops(stopsQuery.data ?? []), [stopsQuery.data]);
  const others = useMemo(() => (route && all ? otherDirections(all, route) : []), [route, all]);
  const from = route?.startStopName ? shortStopName(route.startStopName) : null;
  const to = route?.endStopName ? shortStopName(route.endStopName) : null;

  useEffect(() => {
    document.title = route ? `Route ${route.routeNumber ?? ""} ${from ?? ""} → ${to ?? ""} · BusMate`.replace(/\s+/g, " ") : "Route · BusMate";
  }, [route, from, to]);

  const searchHref =
    route?.startStopId && route?.endStopId
      ? findMyBusPath({ fromStopId: route.startStopId, toStopId: route.endStopId, fromText: route.startStopName ?? "", toText: route.endStopName ?? "", date: todayInSriLanka() })
      : null;

  const hero = (
    <PageHero>
      <HeroBackLink to="/routes">All routes</HeroBackLink>
      {route ? (
        <>
          <p className="mt-1 text-sm font-bold opacity-90">Route {route.routeNumber}</p>
          <h1 className="text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {from && to ? (
              <>
                {from} <span className="text-highlight">→</span> {to}
              </>
            ) : (
              route.name
            )}
          </h1>
        </>
      ) : (
        <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Route</h1>
      )}
    </PageHero>
  );
  const shell = (body: React.ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 pb-16 min-[360px]:px-4 md:px-6">{body}</div>
    </SiteLayout>
  );

  if (routeQuery.isError) {
    const gone = isNotFound(routeQuery.error);
    return shell(
      <Notice
        role="alert"
        icon={gone ? <SearchX className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        title={gone ? "We couldn't find that route" : "We couldn't load this route"}
        actions={
          gone ? (
            <Link to="/routes" className={noticePrimary}>All routes</Link>
          ) : (
            <button type="button" onClick={() => routeQuery.refetch()} className={noticePrimary}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Try again
            </button>
          )
        }
      >
        {gone ? "It may have been removed. The routes list shows every route BusMate has." : "Check your connection and try again."}
      </Notice>,
    );
  }
  if (!route) {
    return shell(
      <div role="status" aria-busy aria-label="Loading route" className="grid gap-4">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
      </div>,
    );
  }

  const km = formatKm(route.distanceKm);
  const duration = formatDuration(route.estimatedDurationMinutes);
  const road = roadTypeLabel(route.roadType);
  const confirmed = confirmedText(route.trust);

  return shell(
    <>
      <section aria-label="Route summary" className="rounded-2xl border border-border bg-card p-4 shadow-float md:p-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
          {km && (
            <Fact icon={<Milestone className="h-4 w-4" />} label="Distance">
              {km}
            </Fact>
          )}
          {duration && (
            <Fact icon={<Clock className="h-4 w-4" />} label="Usual journey">
              {duration}
            </Fact>
          )}
          {road && (
            <Fact icon={<RouteIcon className="h-4 w-4" />} label="Road">
              {road}
            </Fact>
          )}
          {route.routeThrough && (
            <Fact icon={<Navigation className="h-4 w-4" />} label="Via">
              {route.routeThrough}
            </Fact>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3.5">
          <TrustChip trust={route.trust} prefix="Route data" />
          {confirmed && <span className="text-xs text-muted-foreground">{confirmed}</span>}
          <TrustExplainer />
        </div>
        {route.description && <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{route.description}</p>}
        {searchHref && (
          <Link to={searchHref} className={`${CTA} mt-4`}>
            Find a bus on this route →
          </Link>
        )}
      </section>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-7">
        <section aria-label="Stops" className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-extrabold">Stops</h2>
            {stopsQuery.data && <span className="text-xs text-muted-foreground">{stops.length} stop{stops.length === 1 ? "" : "s"}</span>}
          </div>
          {/* Only PARTIAL says something: UNKNOWN is "nobody has said" and would be noise on every older route. */}
          {route.stopListCompleteness === "PARTIAL" && (
            <p role="note" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              These are only some of this route's stops. The bus stops at others that haven't been listed yet.
            </p>
          )}
          {stopsQuery.isError ? (
            <div role="alert" className="text-sm text-muted-foreground">
              We couldn't load the stops.{" "}
              <button type="button" onClick={() => stopsQuery.refetch()} className="inline-flex min-h-10 items-center font-bold text-primary hover:underline">
                Try again
              </button>
            </div>
          ) : stopsQuery.isPending ? (
            <div role="status" aria-busy aria-label="Loading stops" className="grid gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-soft" />
              ))}
            </div>
          ) : stops.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stops have been recorded for this route yet.</p>
          ) : (
            <RouteStopList stops={stops} />
          )}
        </section>

        {others.length > 0 && (
          <aside aria-label="The other direction" className="rounded-2xl border border-border bg-card p-4 md:p-5 lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
              <ArrowRightLeft className="h-4 w-4 text-primary" aria-hidden />
              The other direction
            </h2>
            <ul className="mt-3 grid gap-2">
              {others.map((o) => (
                <li key={o.id}>
                  <Link to={`/routes/${o.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-soft px-3.5 py-2 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="min-w-0 text-[15px] font-bold leading-tight">
                      {o.startStopName ? shortStopName(o.startStopName) : "—"} <span className="text-primary">→</span> {o.endStopName ? shortStopName(o.endStopName) : "—"}
                    </span>
                    <span className="flex-none text-xs text-muted-foreground">Route {o.routeNumber}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </>,
  );
}
