# S3 — Capabilities

> Capability inventory (what / how / maturity / evidence). Known issues are referenced by ID; their
> detail + analysis live in [gaps-and-improvements.md](gaps-and-improvements.md).

### C-S3-01 · Generate dated trips from a schedule
- **What it does:** materialise a schedule into one `pending` trip per date across its validity
  window (or an explicit range).
- **How it works:** `generateTripsForSchedule` sorts `ScheduleStop`s, takes first-stop departure /
  last-stop arrival as trip times, loops per day skipping dates that already have a trip.
  (`TripServiceImpl.java:432-517`)
- **Maturity:** 🟡 works but generates wrong days.
- **Evidence:** ✅ code-read 2026-07-11
- **Known issues:** → G-S3-01 (ignores calendar/exceptions), G-S3-02 (NPE on open-ended)

### C-S3-02 · Query / filter / paginate trips
- **What it does:** read API by id/schedule/route/date/range/status/bus/driver/conductor/PSP, plus a
  paged, sorted, searchable list with assignment-status filters.
- **How it works:** `getAllTripsWithFilters` builds a JPA `Specification` with **explicit LEFT
  joins** (deliberately avoiding the implicit INNER join that previously hid busless trips).
  (`TripServiceImpl.java:133-262`, comment `:152-157`)
- **Maturity:** 🟢
- **Evidence:** ✅ code-read 2026-07-11 · ✅ live-verified (operator trips feature)
- **Known issues:** none material

### C-S3-03 · Assign PSP / bus / conductor to a trip
- **What it does:** attach permit, bus, conductor (single + bulk PSP); operator-ownership enforced
  by the S4 operator-scoped controller.
- **How it works:** `assignPassengerServicePermitToTrip`/`assignBusToTrip`/`assignConductorToTrip`
  (`TripServiceImpl.java:519-731`); bus↔PSP operator-match invariant (`:652-659`); duplicate
  PSP+route+date blocked (`:541-548`).
- **Maturity:** 🟢
- **Evidence:** ✅ code-read 2026-07-11 · ✅ live-verified
- **Known issues:** → G-S3-06 (no overlap/double-booking check), G-S3-11 (no notifications)

### C-S3-04 · Trip lifecycle transitions (start / complete / cancel / status)
- **What it does:** move a trip through its lifecycle; capture actual departure/arrival.
- **How it works:** `startTrip` (pending→active, guarded), `completeTrip` (active→completed,
  guarded), `cancelTrip`, `updateTripStatus` (raw setter). (`TripServiceImpl.java:366-423`)
- **Maturity:** 🟡 happy path verified; guards incomplete.
- **Evidence:** ✅ code-read 2026-07-11
- **Known issues:** → G-S3-03 (no state-machine guard), G-S3-04 (cancel overwrites notes)

### C-S3-05 · Conductor self-service execution
- **What it does:** a conductor lists their assigned trips and starts/completes/cancels only those.
- **How it works:** `ConductorController` calls `verifyOwnership` before each write
  (`ConductorController.java:86-140`); `Trip.conductorId` is a bare user-service userId.
- **Maturity:** 🟢 (self-service path)
- **Evidence:** ✅ code-read 2026-07-11 · ✅ live-verified (conductor-mobile journeys)
- **Known issues:** → G-S3-05 (the generic `/api/trips/*` lifecycle endpoints it wraps have no
  ownership/role check)

### C-S3-06 · Trip statistics & filter options
- **What it does:** KPI aggregates (counts by status/route/operator/schedule, per-day/week/month,
  completion/cancellation rate, peaks) + filter-option lookups.
- **How it works:** `getStatistics`/`getFilterOptions` fan out to repository aggregate queries.
  (`TripServiceImpl.java:913-1219`)
- **Maturity:** 🟡 real aggregates, one faked metric.
- **Evidence:** ✅ code-read 2026-07-11
- **Known issues:** → G-S3-07 (on-time performance hardcoded 85%, `:1066-1069`)

### C-S3-07 · Actual-time capture (feedback data)
- **What it does:** records trip-level `actualDepartureTime`/`actualArrivalTime` at start/complete.
- **How it works:** `LocalTime.now()` in `startTrip`/`completeTrip` (`:388,405`).
- **Maturity:** 🔴 trip-level only; no per-stop actuals; no delay capture.
- **Evidence:** ✅ code-read 2026-07-11
- **Known issues:** → G-S3-09 (no per-stop actuals; `LocalTime` has no date part) — the broken
  feedback loop that blocks real ETAs (S6), real OTP (C-S3-06), analytics (S8)

### C-S3-08 · Delete trip
- **What it does:** hard-delete a trip.
- **How it works:** `deleteTrip` existence-check then `deleteById`; `DELETE /api/trips/{id}` has no
  role/ownership check. (`:425-430`)
- **Maturity:** 🟡 works, unsafe.
- **Evidence:** ✅ code-read 2026-07-11
- **Known issues:** → G-S3-08 (can orphan ticketing rows; no soft-delete)

### C-S3-09 · Driver assignment
- **What it does:** intended driver-per-trip assignment.
- **How it works:** `Trip.driverId` bare UUID with read query + `hasDriver` filter, but **no assign
  endpoint, no Driver entity, no UI** — only settable via the raw create/update DTO. (`Trip.java:52-53`)
- **Maturity:** 🔴 column-only stub.
- **Evidence:** ✅ code-read 2026-07-11
- **Known issues:** → G-S3-10

---

## Inventory summary

| ID | Capability | Maturity | Evidence | Issues |
|---|---|---|---|---|
| C-S3-01 | Generate trips | 🟡 | ✅ code | G-S3-01, G-S3-02 |
| C-S3-02 | Query/filter/paginate | 🟢 | ✅ code+live | — |
| C-S3-03 | Assign PSP/bus/conductor | 🟢 | ✅ code+live | G-S3-06, G-S3-11 |
| C-S3-04 | Lifecycle transitions | 🟡 | ✅ code | G-S3-03, G-S3-04 |
| C-S3-05 | Conductor self-service | 🟢 | ✅ code+live | G-S3-05 |
| C-S3-06 | Statistics | 🟡 | ✅ code | G-S3-07 |
| C-S3-07 | Actual-time capture | 🔴 | ✅ code | G-S3-09 |
| C-S3-08 | Delete trip | 🟡 | ✅ code | G-S3-08 |
| C-S3-09 | Driver assignment | 🔴 | ✅ code | G-S3-10 |
