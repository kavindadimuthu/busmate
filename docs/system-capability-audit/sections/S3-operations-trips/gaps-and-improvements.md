# S3 — Gaps & Improvements

> Identify + Analyze. Gaps found during capture, each turned into an analyzed improvement candidate.
> Ranking + status live in [backlog.md](backlog.md).

## Limitations & gaps (Identify)

| ID | Gap / limitation | Type | Affects | Evidence |
|---|---|---|---|---|
| G-S3-01 | Trip generation ignores `ScheduleCalendar` + `ScheduleException` — makes trips on non-service days, skips `ADDED` days; disagrees with passenger search | bug | C-S3-01 | ✅ `TripServiceImpl:483-504` |
| G-S3-02 | NPE when generating for an open-ended schedule (`toDate` null **and** `effectiveEndDate` null) | bug | C-S3-01 | ✅ `TripServiceImpl:442,448` |
| G-S3-03 | `updateTripStatus` sets any value with no validation; `cancelTrip` has no status guard (completed→cancelled allowed) — no state machine | bug | C-S3-04 | ✅ `TripServiceImpl:366-376,412-423` |
| G-S3-04 | `cancelTrip` writes the reason into `Trip.notes`, destroying any existing note | bug | C-S3-04 | ✅ `TripServiceImpl:418` |
| G-S3-05 | Generic `/api/trips/{id}/start\|complete\|cancel\|delete` have no ownership/role check — any authenticated user drives any trip | security | C-S3-05, C-S3-08 | ✅ `ConductorController:29-31`, `TripController:242-373` |
| G-S3-06 | No conflict/overlap validation — same bus/conductor assignable to time-overlapping trips | limitation | C-S3-03 | ✅ `TripServiceImpl:644,697` |
| G-S3-07 | On-time performance is hardcoded `85.0` — dashboard shows a fabricated metric | bug | C-S3-06 | ✅ `TripServiceImpl:1066-1069` |
| G-S3-08 | `deleteTrip` is an unguarded hard delete — can orphan ticketing rows referencing `tripId` | limitation | C-S3-08 | ✅ `TripServiceImpl:425-430` |
| G-S3-09 | No per-stop actuals; `actualDeparture/ArrivalTime` are `LocalTime` (no date part) — the broken feedback loop | missing | C-S3-07 | ✅ `Trip.java:39-46` |
| G-S3-10 | `driverId` is a column-only stub — no entity, assign endpoint, or UI | missing | C-S3-09 | ✅ `Trip.java:52-53` |
| G-S3-11 | Assignment notifies nobody (conductor/operator) — no notification service exists | missing | C-S3-03 | 🔎 design-level |
| G-S3-12 | 4 enum statuses (`delayed/in_transit/boarding/departed`) counted in stats but never set by any transition | limitation | C-S3-04 | ✅ `TripStatusEnum.java`, `TripServiceImpl:927-930` |

## Improvement candidates (Analyze)

### I-S3-01 · Calendar/exception-aware trip generation
- **Addresses:** G-S3-01
- **Proposal:** in the per-day loop, skip dates not matching `ScheduleCalendar` weekday rules and
  `REMOVED` exceptions; include `ADDED` exception dates.
- **Root cause:** the loop was written as a naive date walk before calendars/exceptions existed on
  the schedule model.
- **Impact if done:** trip data matches passenger search (the single biggest correctness win);
  prerequisite for trustworthy stats.
- **Dependencies / risk:** read-only within core-service; needs regression check vs. existing
  generated trips. Low risk.
- **Rough sizing:** Impact 5 · Effort 2 · Confidence ✅
- **Suggested owner:** AI

### I-S3-02 · Guard null `effectiveEndDate` in generation
- **Addresses:** G-S3-02
- **Proposal:** if both `toDate` and `effectiveEndDate` are null, reject with 400 (or bound to a
  configured horizon) instead of NPE.
- **Root cause:** open-ended schedules unanticipated in the date-range validation.
- **Impact if done:** removes a 500 on a legitimate schedule shape.
- **Rough sizing:** Impact 3 · Effort 1 · Confidence ✅ — good warm-up, batch with I-S3-01.
- **Suggested owner:** AI

### I-S3-03 · Trip status state-machine guards
- **Addresses:** G-S3-03
- **Proposal:** centralise allowed transitions; reject illegal jumps in `updateTripStatus`; guard
  `cancelTrip` against terminal states.
- **Root cause:** status is a free setter; no transition table.
- **Impact if done:** prevents corrupt lifecycle data feeding stats/passenger views.
- **Dependencies / risk:** must not break the legitimate start/complete/cancel paths.
- **Rough sizing:** Impact 4 · Effort 2 · Confidence ✅
- **Suggested owner:** AI

### I-S3-04 · Stop `cancelTrip` overwriting `notes`
- **Addresses:** G-S3-04
- **Proposal:** add a dedicated `cancellationReason` column (or append), leave `notes` intact.
- **Root cause:** reason had nowhere to go, reused `notes`.
- **Impact if done:** preserves operational notes; small schema add.
- **Rough sizing:** Impact 3 · Effort 1 · Confidence ✅
- **Suggested owner:** AI

### I-S3-05 · Ownership/role-gate the generic lifecycle endpoints
- **Addresses:** G-S3-05
- **Proposal:** require MOT/admin role (or route all conductor traffic through the scoped
  controller) on `/api/trips/{id}/start|complete|cancel|delete`.
- **Root cause:** endpoints predate the ownership model added to `ConductorController`.
- **Impact if done:** closes a real authorization hole.
- **Dependencies / risk:** **needs a policy decision** — who may drive these? (design first)
- **Rough sizing:** Impact 4 · Effort 2 · Confidence ✅
- **Suggested owner:** AI+Human

### I-S3-06 · Bus/conductor double-booking validation
- **Addresses:** G-S3-06
- **Proposal:** on assign, reject if the bus/conductor is already on another trip whose
  scheduled window overlaps.
- **Root cause:** assign only checks the *current* trip's slot.
- **Impact if done:** prevents physically-impossible assignments.
- **Dependencies / risk:** needs an overlap query; define "overlap" (same date + time range).
- **Rough sizing:** Impact 4 · Effort 3 · Confidence ✅
- **Suggested owner:** AI+Human

### I-S3-07 · Real on-time performance metric
- **Addresses:** G-S3-07
- **Proposal:** compute OTP from actual vs. scheduled times.
- **Root cause:** no reliable actuals → placeholder.
- **Impact if done:** first true performance metric.
- **Dependencies / risk:** **blocked on I-S3-08** (needs per-stop or at least reliable trip actuals).
- **Rough sizing:** Impact 4 · Effort 3 · Confidence ✅
- **Suggested owner:** AI+Human

### I-S3-08 · Per-stop actual-time capture (`trip_stop_event`)
- **Addresses:** G-S3-09
- **Proposal:** a `trip_stop_event` table (arrival/departure per stop, timestamped) fed by
  conductor/timekeeper apps; migrate trip actuals to full timestamps.
- **Root cause:** the feedback loop was modelled (`ScheduleStop.*Unverified/*Calculated`) but never
  built.
- **Impact if done:** unlocks real ETAs (S6), OTP (I-S3-07), analytics (S8) — highest leverage.
- **Dependencies / risk:** cross-section (S3/S6/S7/S8), schema + app changes; design-first.
- **Rough sizing:** Impact 5 · Effort 4 · Confidence 🔎 → **escalate to root roll-up (X-01)**.
- **Suggested owner:** Human

### I-S3-09 · Guard/soft-delete trips that have tickets
- **Addresses:** G-S3-08
- **Proposal:** block/soft-delete when ticketing references the trip; return 409 with context.
- **Root cause:** hard delete with no cross-service check.
- **Dependencies / risk:** cross-service check into ticketing (S5).
- **Rough sizing:** Impact 3 · Effort 2 · Confidence ✅
- **Suggested owner:** AI+Human

### I-S3-10 · Wire or trim the dead statuses
- **Addresses:** G-S3-12
- **Proposal:** decide — either drive `delayed/in_transit/boarding/departed` from timekeeper events
  or remove them from the enum + stats.
- **Root cause:** vocabulary reserved for a timekeeper flow never built.
- **Dependencies / risk:** decision depends on I-S3-08 / S7 direction.
- **Rough sizing:** Impact 2 · Effort 2 · Confidence ✅
- **Suggested owner:** Human (decision first)

### I-S3-11 · Driver entity + assignment
- **Addresses:** G-S3-10
- **Proposal:** mirror the conductor model — driver assign endpoint + ownership, optional entity.
- **Root cause:** driver half-modelled.
- **Rough sizing:** Impact 3 · Effort 4 · Confidence ✅
- **Suggested owner:** AI+Human

### I-S3-12 · Assignment notifications
- **Addresses:** G-S3-11
- **Proposal:** notify conductor/operator on assign/reassign/cancel.
- **Dependencies / risk:** **no notification service exists** — cross-cutting; **escalate to root
  roll-up (X-02)**.
- **Rough sizing:** Impact 3 · Effort 3 · Confidence 🔎
- **Suggested owner:** AI+Human
