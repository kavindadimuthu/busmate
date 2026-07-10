# Stage 7 — Monitoring (real-time)

**What this stage means in transit practice:** knowing where the service is *right now* — AVL
(automatic vehicle location), schedule adherence / headway monitoring, control-room alerting,
and real-time passenger information (ETAs, live maps, disruption notices).

## What BusMate has today

Honestly: **nothing real.**

- **MOT "Live Tracking" page** — a polished map UI driven entirely by a client-side simulation
  (`data/mot/tracking-mock/locationTrackingSimulation.ts` with hard-coded `ROUTE_PATHS`). No
  vehicle has ever reported a real position; there is no ingest endpoint, no position table, no
  streaming channel anywhere in the backend.
- **Trip status is the only live-ish signal** — a trip flips to `active` when the conductor
  starts it and `completed` when they finish. Between those two moments the system knows nothing.
- **Admin → Monitoring** exists but is *system* monitoring (API health panel), not transit
  monitoring — worth keeping, just not this stage.
- Passenger apps show scheduled times only; no ETAs, no live map, no service alerts.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **No GPS/AVL ingest at all** | Critical (for this stage) | Nothing to monitor without positions. No hardware requirement is actually necessary — see improvement 1. |
| **Tracking UI misrepresents capability** | Medium | The mock map looks production-ready; anyone demoing it inherits an expectation the backend can't meet. Label it as a prototype or wire it first. |
| **No schedule-adherence computation** | High | Even with per-stop actuals (stage 6, item 3), nothing compares actual vs. scheduled to produce delay/OTP; both the data and the calculation are missing today. |
| **No alerting** | Medium | No "trip should have started 15 min ago and hasn't", no headway-gap alarms, no control-room concept. Some of this needs no GPS — trip-start lateness is computable from existing data *today*. |
| **No real-time passenger information** | High (product value) | ETAs are the single most-wanted passenger feature; blocked on positions + delay model. |
| No SSE/WebSocket infrastructure | Medium | Everything is request/response through the gateway; a push channel is a prerequisite for live maps/ETAs and is also what notifications (stage 6) want. |

## Improvement candidates (ordered)

1. **Conductor-mobile as the AVL device (v1)** — the phone is already on the bus, authenticated,
   and knows which trip is active. A periodic position ping (`POST /api/v1/conductor/trips/{id}/position`)
   into a `trip_position` table costs one endpoint + one background task in the app. This is the
   cheapest credible entry into real-time and is already roadmap item #2 in the route-network
   gap list.
2. **Wire the tracking page to real positions** (replace the simulation; SSE or short-polling
   fan-out via the gateway). Scope v1 to "dots with trip status", not ETAs.
3. **Zero-GPS alerting first**: a scheduled check for `pending` trips past their scheduled
   departure (+ threshold) → flag on the day-of dashboard (stage 6, item 5). Deliverable this
   week; no new data needed.
4. **Delay model v1** — once per-stop actuals exist (timekeeper rebuild) or positions exist,
   compute delay-at-last-known-point and propagate it forward down the remaining stops as a naive
   ETA. Combine with 1–2 for passenger-facing ETAs (route-network roadmap's "payoff feature").
5. Defer headway monitoring, control-room UIs, and prediction models until 1–4 exist.

**Verdict: 🔴 no real monitoring exists — one fully-mock tracking UI and a binary
started/completed trip signal. The redeeming feature: conductor-mobile makes real AVL unusually
cheap to bootstrap, and some alerting is possible with zero new data.**
