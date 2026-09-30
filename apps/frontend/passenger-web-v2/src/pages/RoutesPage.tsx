import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, RefreshCw, Route as RouteIcon, Search, SearchX, X } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary, noticeSecondary } from "@/components/findmybus/noticeStyles";
import { Chip } from "@/components/findmybus/FilterControls";
import { TrustExplainer } from "@/components/trust/TrustExplainer";
import RouteCard from "@/components/routes/RouteCard";
import { useRoutes } from "@/lib/routesApi";
import { countLabel, filterRoutes, roadTypeOptions, sortRoutes, type RouteSort } from "@/lib/routes.ts";

const SORTS: { id: RouteSort; label: string }[] = [
  { id: "number", label: "Route number" },
  { id: "shortest", label: "Shortest distance" },
  { id: "longest", label: "Longest distance" },
];

/** Every published route, searchable without knowing where you're going. The search, road type and order live in the
 * address, so the back button and a shared link bring the same list. */
export default function RoutesPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const road = params.get("road") ?? "";
  const sortParam = params.get("sort");
  const sort: RouteSort = SORTS.some((s) => s.id === sortParam) ? (sortParam as RouteSort) : "number";
  const { data, isPending, isError, refetch } = useRoutes();

  useEffect(() => {
    document.title = "Routes · BusMate";
  }, []);

  const change = (next: { q?: string; road?: string; sort?: RouteSort }) => {
    const p = new URLSearchParams(params);
    const set = (k: string, v: string | undefined, blank: string) => (v === undefined || v === blank ? p.delete(k) : p.set(k, v));
    if ("q" in next) set("q", next.q?.trimStart(), "");
    if ("road" in next) set("road", next.road, "");
    if ("sort" in next) set("sort", next.sort, "number");
    setParams(p, { replace: true });
  };

  const routes = useMemo(() => data ?? [], [data]);
  const shown = useMemo(() => sortRoutes(filterRoutes(routes, { query, roadType: road }), sort), [routes, query, road, sort]);
  const roads = useMemo(() => roadTypeOptions(routes), [routes]);
  const filtered = query.trim() !== "" || road !== "";

  return (
    <SiteLayout>
      <PageHero compact>
        <h1 className="mt-4 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Routes</h1>
        <p className="mt-1.5 max-w-xl text-sm opacity-90">Every bus route BusMate knows, with its stops. Open one to see where it goes, or to look for a bus on it.</p>
      </PageHero>

      <div className="mx-auto max-w-[1240px] px-3 pb-16 pt-5 min-[360px]:px-4 md:px-6">
        {isError ? (
          <Notice
            role="alert"
            icon={<AlertTriangle className="h-6 w-6" />}
            title="We couldn't load the routes"
            actions={
              <button type="button" onClick={() => refetch()} className={noticePrimary}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                Try again
              </button>
            }
          >
            Check your connection and try again.
          </Notice>
        ) : isPending ? (
          <div role="status" aria-busy aria-label="Loading routes" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <Notice icon={<RouteIcon className="h-6 w-6" />} title="No routes have been published yet">
            Check back soon.
          </Notice>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <label className="relative block">
                <span className="sr-only">Search routes</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => change({ q: e.target.value })}
                  placeholder="Search by number, town or stop"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="min-h-12 w-full rounded-xl border border-border bg-card pl-11 pr-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                <span className="flex-none">Order</span>
                <select
                  value={sort}
                  onChange={(e) => change({ sort: e.target.value as RouteSort })}
                  className="min-h-12 w-full rounded-xl border border-border bg-card px-3 text-[14px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {roads.length > 1 && (
              <div role="group" aria-label="Road type" className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 min-[360px]:-mx-4 min-[360px]:px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                <Chip pressed={road === ""} onClick={() => change({ road: "" })}>
                  All <span className="text-xs font-medium opacity-80">{routes.length}</span>
                </Chip>
                {roads.map((r) => (
                  <Chip key={r.id} pressed={road === r.id} onClick={() => change({ road: road === r.id ? "" : r.id })}>
                    {r.label} <span className="text-xs font-medium opacity-80">{r.count}</span>
                  </Chip>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p role="status" aria-live="polite" className="text-sm font-bold">
                {countLabel(shown.length)}
                {filtered && <span className="font-medium text-muted-foreground"> of {routes.length}</span>}
              </p>
              <span className="flex items-center gap-1">
                {filtered && (
                  <button type="button" onClick={() => setParams({}, { replace: true })} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <X className="h-4 w-4" aria-hidden />
                    Clear
                  </button>
                )}
                <TrustExplainer />
              </span>
            </div>

            {shown.length === 0 ? (
              <div className="mt-3">
                <Notice
                  role="status"
                  icon={<SearchX className="h-6 w-6" />}
                  title="No routes match"
                  actions={
                    <button type="button" onClick={() => setParams({}, { replace: true })} className={noticeSecondary}>
                      Clear the search
                    </button>
                  }
                >
                  Try a town, a stop or a route number, or a shorter word: "gal" finds Galle.
                </Notice>
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {shown.map((r) => (
                  <li key={r.id} className="flex">
                    <div className="flex-1">
                      <RouteCard route={r} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  );
}
