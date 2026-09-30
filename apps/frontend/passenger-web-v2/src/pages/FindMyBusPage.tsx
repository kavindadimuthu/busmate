import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeftRight, Bus, RefreshCw, SearchX, SlidersHorizontal } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import TripSearchBar from "@/components/search/TripSearchBar";
import ResultCard from "@/components/findmybus/ResultCard";
import SearchSummary from "@/components/findmybus/SearchSummary";
import DayNav, { searchWithDate } from "@/components/findmybus/DayNav";
import StopChooser from "@/components/findmybus/StopChooser";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary, noticeSecondary } from "@/components/findmybus/noticeStyles";
import {
  Chip,
  ClearFilters,
  FiltersPanel,
  SortTabs,
  TimeBandChips,
} from "@/components/findmybus/FilterControls";
import { TrustExplainer } from "@/components/trust/TrustExplainer";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { searchFailure, useFindMyBus, useStopCandidates } from "@/lib/findMyBusApi";
import {
  NO_FILTERS,
  activeFilterCount,
  addDays,
  applyFilters,
  cancelledLast,
  formatDayName,
  hasExtraFilters,
  isStopId,
  readSearchParams,
  resolveStopText,
  shortStopName,
  sortBuses,
  splitByPassed,
  type Filters,
  type SortKey,
  type StopCandidate,
} from "@/lib/findMyBus";
import { findMyBusPath, todayInSriLanka } from "@/lib/search";
import { useMediaQuery } from "@/lib/useMediaQuery";
import heroBus from "@/assets/hero-bus.webp";

type Side =
  | { state: "ready"; id: string; name: string; resolved: boolean }
  | { state: "loading" }
  | { state: "ambiguous"; typed: string; options: StopCandidate[] }
  | { state: "none"; typed: string }
  | { state: "empty" };

/** One end of the search: a stop id from the link, or typed text turned into a stop when that is safe. */
function useSide(idParam: string, nameParam: string, textParam: string): Side {
  const hasId = isStopId(idParam);
  const typed = textParam || nameParam;
  const canLookUp = !hasId && typed.trim().length >= 2;
  const candidates = useStopCandidates(typed, canLookUp);

  if (hasId) return { state: "ready", id: idParam, name: nameParam || textParam, resolved: false };
  if (!typed.trim()) return { state: "empty" };
  if (!canLookUp || candidates.isError) return { state: "none", typed };
  if (candidates.isPending) return { state: "loading" };
  const r = resolveStopText(typed, candidates.data ?? []);
  if (r.kind === "match") return { state: "ready", id: r.stop.id, name: r.stop.name, resolved: true };
  if (r.kind === "ambiguous") return { state: "ambiguous", typed, options: r.options };
  return { state: "none", typed };
}

/** What the passenger typed for a side whose stop isn't settled yet, for showing back to them. */
const typedOf = (side: Side): string => (side.state === "ambiguous" || side.state === "none" ? side.typed : "");

const Skeletons = () => (
  <div aria-busy role="status" aria-label="Searching for buses" className="grid gap-3.5">
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-[220px] animate-pulse rounded-2xl border border-border bg-card" />
    ))}
  </div>
);

export default function FindMyBusPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const today = todayInSriLanka();
  const params = useMemo(() => readSearchParams(search, today), [search, today]);

  const from = useSide(params.fromStopId, params.fromName, params.fromText);
  const to = useSide(params.toStopId, params.toName, params.toText);
  const fromId = from.state === "ready" ? from.id : "";
  const toId = to.state === "ready" ? to.id : "";
  const sameStop = !!fromId && fromId === toId;

  const query = useFindMyBus(fromId, toId, params.date, !!fromId && !!toId && !sameStop);
  const response = query.data;
  const fromName = response?.fromStop?.name || (from.state === "ready" ? from.name : "");
  const toName = response?.toStop?.name || (to.state === "ready" ? to.name : "");

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>("earliest");
  const [showPassed, setShowPassed] = useState(false);
  const [editing, setEditing] = useState(false);

  // A new search starts clean.
  useEffect(() => {
    setFilters(NO_FILTERS);
    setShowPassed(false);
    setEditing(false);
  }, [fromId, toId, params.date]);

  // Names typed without picking a stop were turned into stops: make the address say so.
  useEffect(() => {
    if (from.state === "ready" && to.state === "ready" && (from.resolved || to.resolved)) {
      const path = findMyBusPath({ fromStopId: from.id, toStopId: to.id, fromText: from.name, toText: to.name, date: params.date });
      if (path) navigate(path, { replace: true });
    }
  }, [from, to, params.date, navigate]);

  useEffect(() => {
    document.title = fromName && toName ? `${fromName} → ${toName} · BusMate` : "Find My Bus · BusMate";
  }, [fromName, toName]);

  const pick = (side: "from" | "to", stop: StopCandidate) => {
    const q = new URLSearchParams(search);
    q.set(`${side}StopId`, stop.id);
    q.set(`${side}Name`, stop.name);
    q.delete(`${side}Text`);
    navigate({ search: `?${q.toString()}` }, { replace: true });
  };

  const all = useMemo(() => response?.results ?? [], [response]);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const { upcoming, passed } = useMemo(() => {
    const split = splitByPassed(sortBuses(filtered, sort), params.date);
    return { upcoming: cancelledLast(split.upcoming), passed: split.passed };
  }, [filtered, sort, params.date]);
  const noneLeftToday = upcoming.length === 0 && passed.length > 0;
  const passedVisible = showPassed || noneLeftToday;
  const filterCount = activeFilterCount(filters);
  const hidden = all.length - filtered.length;
  // With one bus there is nothing to sort or narrow.
  const canRefine = all.length >= 2;

  const needsInput =
    from.state === "empty" || to.state === "empty" || from.state === "none" || to.state === "none" || sameStop;
  const resolving = from.state === "loading" || to.state === "loading";
  const choosing = from.state === "ambiguous" || to.state === "ambiguous";
  const showForm = editing || needsInput;
  const dayLink = (delta: number) => searchWithDate(search, addDays(params.date, delta));
  const swapLink = fromId && toId ? { pathname: "/findmybus", search: `?${new URLSearchParams({ fromStopId: toId, toStopId: fromId, fromName: toName, toName: fromName, date: params.date })}` } : null;

  const bar = (
    <TripSearchBar
      key={`${search}|${fromName}|${toName}`}
      initial={{
        fromText: fromName || typedOf(from) || params.fromText,
        toText: toName || typedOf(to) || params.toText,
        fromStopId: fromId,
        toStopId: toId,
        date: params.date,
      }}
    />
  );

  const failure = query.isError ? searchFailure(query.error) : null;

  return (
    <SiteLayout>
      <section
        className="relative overflow-hidden bg-[#1e3a8a] bg-cover px-4 pb-[54px] pt-5 text-white md:px-6 lg:bg-[image:var(--hero)] lg:pb-[100px] lg:pt-12"
        style={{ ["--hero" as string]: `url(${heroBus})`, backgroundPosition: "78% center" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,22,68,.94),rgba(30,64,175,.85))] lg:bg-[linear-gradient(90deg,rgba(9,22,68,.94)_0%,rgba(20,48,130,.82)_45%,rgba(30,64,175,.3)_100%)]" />
        <div className="relative mx-auto max-w-[1240px]">
          <div className="text-[11px] font-extrabold tracking-[0.2em] opacity-85 lg:text-xs">FIND MY BUS</div>
          <p className="mt-1 text-[clamp(20px,5.6vw,44px)] font-extrabold leading-tight tracking-[-0.03em]">Search buses across Sri Lanka</p>
          <p className="mt-1 hidden opacity-90 lg:block">Direct buses between any two stops, with where each time comes from.</p>
        </div>
      </section>

      <div className="relative z-[5] mx-auto -mt-[42px] max-w-[1240px] px-3 min-[360px]:px-4 md:px-6 lg:-mt-[70px]">
        {isDesktop || showForm ? (
          <div className="grid gap-2">
            {bar}
            {!isDesktop && !needsInput && (
              <button type="button" onClick={() => setEditing(false)} className="min-h-11 text-sm font-bold text-primary">
                Cancel
              </button>
            )}
          </div>
        ) : (
          <SearchSummary
            from={shortStopName(fromName || typedOf(from)) || "…"}
            to={shortStopName(toName || typedOf(to)) || "…"}
            date={params.date}
            onEdit={() => setEditing(true)}
          />
        )}
      </div>

      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 md:px-6 lg:flex lg:items-start lg:gap-7">
        {response && canRefine && (
          <aside aria-label="Filters" className="sticky top-24 hidden w-[280px] flex-none rounded-2xl border border-border bg-card p-5 lg:block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-extrabold">Filters</h2>
              <ClearFilters filters={filters} onChange={setFilters} className="-my-2" />
            </div>
            <FiltersPanel buses={all} filters={filters} onChange={setFilters} />
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {needsInput ? (
            <Notice icon={<SearchX className="h-6 w-6" />} title={sameStop ? "Choose two different stops" : "Where are you going?"} role="status">
              {sameStop
                ? "Your two stops are the same one. Change either to see the buses between them."
                : from.state === "none" || to.state === "none"
                  ? `We couldn't find a stop called “${from.state === "none" ? typedOf(from) : typedOf(to)}”. Try another spelling, or pick from the suggestions as you type.`
                  : "Enter where you're leaving from and where you're going, then choose a date."}
            </Notice>
          ) : resolving ? (
            <div role="status" aria-label="Finding your stops" className="grid gap-3.5">
              <div className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
              <Skeletons />
            </div>
          ) : choosing ? (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">More than one stop matches. Choose the ones you meant:</p>
              {from.state === "ambiguous" && <StopChooser label="From" typed={from.typed} options={from.options} onPick={(s) => pick("from", s)} />}
              {to.state === "ambiguous" && <StopChooser label="To" typed={to.typed} options={to.options} onPick={(s) => pick("to", s)} />}
            </div>
          ) : failure ? (
            <Notice
              role="alert"
              icon={<AlertTriangle className="h-6 w-6" />}
              title={failure.title}
              actions={
                failure.retryable ? (
                  <button type="button" onClick={() => query.refetch()} className={noticePrimary}>
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                    Try again
                  </button>
                ) : (
                  <button type="button" onClick={() => setEditing(true)} className={noticePrimary}>
                    Change search
                  </button>
                )
              }
            >
              {failure.body}
            </Notice>
          ) : query.isPending ? (
            <Skeletons />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                <div className="min-w-0">
                  <h1 className="text-[clamp(20px,5.4vw,26px)] font-extrabold leading-tight tracking-[-0.01em]">
                    {shortStopName(fromName)} <span className="text-primary">→</span> {shortStopName(toName)}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                    {all.length === 0
                      ? "No direct buses"
                      : hidden > 0
                        ? `${filtered.length} of ${all.length} ${all.length === 1 ? "bus" : "buses"} shown`
                        : `${all.length} ${all.length === 1 ? "bus" : "buses"}`}
                  </p>
                </div>
                <DayNav date={params.date} today={today} search={search} />
              </div>

              {params.date < today && (
                <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200">
                  That date has passed, so these are the usual timetable times for reference.{" "}
                  <Link to={{ search: searchWithDate(search, today) }} replace className="font-bold underline">
                    Search today
                  </Link>
                </p>
              )}

              {all.length === 0 ? (
                <Notice
                  className="mt-5"
                  icon={<Bus className="h-6 w-6" />}
                  title={`No direct buses on ${formatDayName(params.date)}`}
                  actions={
                    <>
                      {swapLink && (
                        <Link to={swapLink} replace className={noticePrimary}>
                          <ArrowLeftRight className="mr-2 h-4 w-4" aria-hidden />
                          Try {shortStopName(toName)} → {shortStopName(fromName)}
                        </Link>
                      )}
                      <Link to={{ search: dayLink(1) }} replace className={noticeSecondary}>
                        Try the next day
                      </Link>
                    </>
                  }
                >
                  BusMate lists buses that run straight between two stops. Try nearby stops, another day, or the other direction.
                </Notice>
              ) : (
                <>
                  <div className="mt-5 grid gap-3">
                    {canRefine && (
                      <>
                        <SortTabs value={sort} onChange={setSort} />
                        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 lg:hidden [&::-webkit-scrollbar]:hidden">
                          {hasExtraFilters(all) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Chip pressed={filters.roadType !== "" || filters.routes.length > 0}>
                                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                                  More filters
                                </Chip>
                              </DialogTrigger>
                              <DialogContent variant="sheet">
                                <div className="grid gap-1.5">
                                  <DialogTitle>Filters</DialogTitle>
                                  <DialogDescription>Narrow the {all.length} buses on this search.</DialogDescription>
                                </div>
                                <FiltersPanel buses={all} filters={filters} onChange={setFilters} />
                                <div className="flex items-center justify-between gap-3">
                                  <ClearFilters filters={filters} onChange={setFilters} />
                                  <DialogClose asChild>
                                    <button type="button" className={`${noticePrimary} ml-auto`}>
                                      Show {filtered.length} {filtered.length === 1 ? "bus" : "buses"}
                                    </button>
                                  </DialogClose>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <TimeBandChips buses={all} filters={filters} onChange={setFilters} />
                        </div>
                      </>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-x-4">
                      <TrustExplainer />
                      <ClearFilters filters={filters} onChange={setFilters} className="lg:hidden" />
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <Notice
                      className="mt-3"
                      icon={<SlidersHorizontal className="h-6 w-6" />}
                      title="No buses match those filters"
                      actions={
                        <button type="button" onClick={() => setFilters(NO_FILTERS)} className={noticePrimary}>
                          Clear filters
                        </button>
                      }
                    >
                      {filterCount === 1 ? "One filter is" : `${filterCount} filters are`} hiding all {all.length} {all.length === 1 ? "bus" : "buses"}.
                    </Notice>
                  ) : (
                    <div className="mt-3 grid gap-5">
                      {noneLeftToday && (
                        <p role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-tint px-4 py-3 text-sm font-medium">
                          <span>No more buses today: these have already left.</span>
                          <Link to={{ search: dayLink(1) }} replace className="inline-flex min-h-10 items-center font-bold text-primary hover:underline">
                            See tomorrow →
                          </Link>
                        </p>
                      )}
                      {upcoming.length > 0 && (
                        <ol className="grid gap-3.5">
                          {upcoming.map((b, i) => (
                            <li key={b.tripId || `${b.scheduleId}-${i}`}>
                              <ResultCard bus={b} fromStopId={fromId} toStopId={toId} fromName={fromName} toName={toName} date={params.date} />
                            </li>
                          ))}
                        </ol>
                      )}
                      {passed.length > 0 && (
                        <section aria-label="Buses whose scheduled time has passed" className="grid gap-3.5">
                          {!noneLeftToday && (
                            <button
                              type="button"
                              aria-expanded={showPassed}
                              onClick={() => setShowPassed((s) => !s)}
                              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span>
                                Earlier today <span className="font-medium text-muted-foreground">({passed.length})</span>
                              </span>
                              <span className="text-primary">{showPassed ? "Hide" : "Show"}</span>
                            </button>
                          )}
                          {passedVisible && (
                            <ol className="grid gap-3.5">
                              {passed.map((b, i) => (
                                <li key={b.tripId || `${b.scheduleId}-p${i}`}>
                                  <ResultCard bus={b} passed fromStopId={fromId} toStopId={toId} fromName={fromName} toName={toName} date={params.date} />
                                </li>
                              ))}
                            </ol>
                          )}
                        </section>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
