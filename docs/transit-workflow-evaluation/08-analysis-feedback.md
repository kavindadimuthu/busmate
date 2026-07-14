# Stage 8 — Analysis & Feedback

**What this stage means in transit practice:** turning operational exhaust into decisions —
ridership and revenue analysis, on-time performance (OTP), load factors, route/trip
profitability, operator performance, and feeding all of it back into stages 2–5 (redesign
routes, retime timetables, resize fleet/crew).

## What BusMate has today

**Every analytics surface in the product is a mock.** Verified in code:

| Surface | Status |
|---|---|
| MOT → Analytics (Overview/Trips/Routes/Fleet/Staff/Revenue/Passengers tabs) | Mock — `useAnalyticsPage` reads `data/mot/analytics.ts` generators |
| Operator → Revenue Analytics (KPIs, breakdowns by bus/route/conductor/payment, trends) | Mock — `data/operator/revenue.ts` literally says "replace these functions with actual fetch calls" and caches `generateTickets()` |
| MOT / Admin dashboards | Mock (`data/mot/dashboard.ts` etc.) |
| MOT → Fares & Policies pages | Mock (`data/mot/fares.ts`, `data/mot/policies.ts`) — while *real* fares live in ticketing-service (`RouteFare`, `BaseFare`) unconnected to this UI |

Meanwhile the **real data for much of this already exists**: ticketing-service holds real
tickets/bookings/payments per trip/bus/seat; core-service holds trips with statuses,
assignments, trip-level actual start/end times; user-service holds the staff graph. Nobody
queries any of it for analysis.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **No real analytics backend at all** | Critical (for this stage) | Not a single aggregate endpoint exists across the three services. |
| **The mock UIs define a good spec nobody implemented** | Medium | The tab structure (trips/routes/fleet/staff/revenue/passengers) and the operator revenue breakdowns are a sensible target; the risk is they demo as real. |
| **OTP/reliability analysis impossible** | High | Blocked upstream: no per-stop actuals (stage 6), no positions (stage 7). Only trip-level start/complete lateness is computable today — and even that is analysed nowhere. |
| **Load factor / demand analysis missing** | High | Tickets + seat maps + bus capacity are all real — boardings per trip/route/time-band and load factors are computable *today* and would be the first genuine demand signal for stage 3. |
| **Cross-service reporting has no home** | Medium | Revenue-by-route needs ticketing×core joins across separate DBs. No warehouse, no ETL, no read-model. Fine at current scale to do API-level composition in a BFF endpoint; a real decision is needed as data grows. |
| **No exports** | Low | Master-data CSV export exists, but no operational/financial report export (regulator- and operator-facing need). |
| No data-quality feedback | Low | The three-tier verified/unverified/calculated columns (stages 2–3) were designed as a feedback mechanism; with no analysis layer, nothing ever gets promoted or compared. |

## Improvement candidates (ordered)

1. **Operator revenue analytics on real tickets** — the highest value-to-effort item in this
   whole evaluation: ticketing-service already has every row; the mock hook
   (`useRevenueAnalytics`) already defines the exact shapes to serve. One aggregate endpoint (or
   BFF composition in api-gateway) + swapping the data module. Note the ticketing redesign plan
   (direct-IP access, plain-text parsing) should be considered first or in the same motion.
2. **Ridership & load factors** — tickets per trip joined with bus capacity → per-route,
   per-time-band demand curves. Feeds stage 3 (frequency setting) with its first real input.
3. **Trip-completion & lateness report from existing columns** — trips
   generated/assigned/completed/cancelled, and start-time lateness, per route/operator/date. No
   new data capture required.
4. **Wire the MOT fares UI to ticketing's real fare tables** (or explicitly park the page) —
   currently two disconnected fare worlds.
5. **OTP dashboards last** — only after stage 6/7 capture per-stop actuals or positions.
6. When cross-service joins get painful, add a **read model** (materialised reporting tables fed
   by the Kafka events user-service already emits, extended to trip/ticket events) rather than a
   premature warehouse.

**Verdict: 🔴 the feedback stage is entirely mock — yet it's also the cheapest 🔴→🟢 conversion
in the platform, because real tickets and trips are already in the databases and the mock UIs
already specify the target. Closing this loop is what would turn BusMate from a system of record
into a system that improves the service it records.**
