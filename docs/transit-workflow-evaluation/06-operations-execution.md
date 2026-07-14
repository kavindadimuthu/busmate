# Stage 6 — Operations Execution (day of service)

**What this stage means in transit practice:** running the planned service — dispatch,
pull-out/pull-in, departure control at terminals, on-board fare collection, disruption handling
(cancellations, replacements, short-turns), and communicating changes to staff and passengers.

## What BusMate has today

This is BusMate's most complete stage — a real, mostly live-verified execution loop
(see [trips.md](../route-network-and-operations/trips.md) and the
[ticketing docs](../route-network-and-operations/)):

- **Trip materialisation**: MOT generates dated `Trip` rows from an ACTIVE schedule for a date
  range; single + bulk PSP assignment attaches operators.
- **Execution by conductor** (conductor-mobile, live-verified): sees own journeys, starts trip
  (→ active), sells/validates tickets against a **real seat map** (bus `seatLayout` jsonb merged
  with ticketing-service bookings), validate-from-seat, completes trip. Ownership enforced
  server-side.
- **Fare collection**: ticketing-service handles bookings, seats, payments (two-step dummy
  gateway, swappable), conductor validation; passenger-mobile does real online booking. Fares
  come from ticketing's `RouteFare`/`BaseFare` tables.
- **MOT oversight**: trips pages with status management and cancellation (any trip).
- 8 trip statuses modelled (`pending`…`departed`), of which `boarding`/`departed`/`delayed` are
  never set by anything.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **Trip generation ignores `ScheduleCalendar` + `ScheduleException`** | **Critical** | Known bug #1: trips get created for days the service doesn't run and ADDED days are skipped, so passenger search and operational data disagree. Undermines the whole stage. |
| **NPE on open-ended schedules** during generation (null `effectiveEndDate`, no `toDate`) | High | Known bug #2. |
| **Manual, non-rolling generation** | High | Someone must remember to generate trips per schedule per date range. A scheduled "keep N days materialised for every ACTIVE schedule" job is the known fix (roadmap item #4) and also resolves the NPE case. |
| **No disruption workflow** | High | Cancellation exists (and overwrites `Trip.notes` — bug #5) but there's no replacement-bus flow, no short-turn/partial cancellation, and **nobody is notified** — not the assigned conductor, not booked passengers (roadmap item #3; the planned notification service doesn't exist yet). |
| **Unguarded status transitions** | Medium | completed→cancelled allowed; `PATCH /status` allows arbitrary jumps; trips can be generated from non-ACTIVE schedules (bug #4). |
| **No dispatch/day-of control view** | Medium | No screen answers "right now: which trips are running, late, unstaffed, unassigned?" — the operational home page for MOT/timekeeper is missing. Related: unstaffed-trip alerts (stage 5). |
| **Timekeeper is a mock portal** | Medium | The role that would do terminal departure control has a full UI on `data/timekeeper/trips.ts` mock data; the backend even reserves the statuses it would use. Known half-built item. |
| **No per-stop actuals** | High | Only trip-level `actualDeparture/ArrivalTime` exist (set at start/complete). Mid-route progress is invisible — blocks stages 7–8. |
| No incident/log capture | Low | Breakdowns, accidents, diversions have no record; `notes` is the only free text and cancel clobbers it. |

## Improvement candidates (ordered)

1. **Fix generation correctness** (bugs #1, #2) + **lifecycle guards** (#4) + **notes clobber**
   (#5) — small, restores trust in operational data.
2. **Rolling generation job** for ACTIVE schedules.
3. **Rebuild timekeeper on real APIs** with per-stop events (`trip_stop_event`: boarding,
   departed, delay + attribution) — one feature that activates the unused statuses, populates the
   unverified-time columns, and creates the data stage 7 needs. The route-network gap list calls
   this "closes three gaps at once".
4. **Notification service v1** — trip cancelled → conductor + booked passengers; conductor/bus
   assigned → conductor. The ticketing redesign plan already envisions this service.
5. **Day-of-operations dashboard** — next-24h trips with staffing/assignment/status flags.

**Verdict: 🟢 a real end-to-end execution loop — generation → assignment → conductor start →
ticketing → completion — which is rare to see actually working; weakened by one critical
correctness bug (calendar-ignoring generation), the absence of any disruption/notification
handling, and no visibility between departure and arrival.**
