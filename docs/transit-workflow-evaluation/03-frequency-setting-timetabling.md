# Stage 3 — Frequency Setting & Timetabling

**What this stage means in transit practice:** two linked decisions. *Frequency setting*: how
many trips per hour each route gets per period (peak/off-peak/weekend), driven by demand and
policy (max headway, min load factor). *Timetabling*: turning frequencies into departure times
per stop, including running-time profiles by time of day, and synchronising transfers.

## What BusMate has today

BusMate skips frequency setting entirely and goes straight to timetables — but the timetable
model is genuinely rich (see [schedules.md](../route-network-and-operations/schedules.md)):

- **Schedule** per route with type (REGULAR/SPECIAL), status lifecycle
  (PENDING→ACTIVE→INACTIVE/CANCELLED), and effective start/end dates.
- **Per-stop times** (`ScheduleStop`): arrival/departure per route stop, again in three quality
  tiers (verified / unverified-with-attribution / calculated).
- **GTFS-like service calendars**: 7 day-of-week flags plus dated `ScheduleException`s
  (ADDED/REMOVED) — richer than most systems at this maturity.
- **Authoring**: schedule workspace with form / textual / AI modes, clone-schedule, draft
  recovery; MOT-only via gateway permissions.
- Passenger search correctly applies calendars + exceptions + active status.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **No frequency/headway concept at all** | High (conceptual) | Every trip is an explicit hand-authored schedule. There is no "every 15 min from 06:00–09:00" representation, no headway policy, and no way to even *see* the effective headway on a corridor. For a high-frequency urban corridor this makes authoring and maintenance painful. |
| **No demand input** | High (long-term) | Frequencies/times are set by judgment. Ticketing data (real demand!) exists in ticketing-service but never reaches this stage — see [stage 8](08-analysis-feedback.md). |
| **No running-time feedback** | High (long-term) | Per-stop times are estimates forever; there are no observed actuals to compare against (stage 7 gap). The `arrivalTimeUnverified/By` columns anticipate crowd/staff-reported times but nothing writes them. |
| **No conflict detection** | Medium | Overlapping ACTIVE schedules on the same route/calendar are accepted silently (known gap #7 in the route-network list). |
| **No lifecycle guards** | Medium | Any→any status transitions allowed, incl. resurrecting CANCELLED schedules (known bug #4). |
| No transfer synchronisation | Low (scope) | Timed transfers between routes are a sophisticated capability; noting it for completeness. |
| No period structure | Medium | A schedule is one departure pattern. Peak vs. off-peak variants require separate schedules with nothing linking them, and no view aggregates "all service on route X". |

## Improvement candidates

1. **Route-level service view** — for one route + date: every ACTIVE schedule's departures
   merged into a single timeline, with computed headways. Pure read model over existing data;
   instantly reveals gaps/bunching in authored service and is the natural home for conflict
   warnings.
2. **Schedule-overlap validation** on create/activate (same route, intersecting effective window,
   intersecting calendar days, same departure time ± tolerance).
3. **Headway-based authoring assist** — keep the storage model (explicit schedules) but let the
   workspace *generate* them: "first departure 06:00, every 20 min until 10:00, running-time
   profile from the existing schedule" → N cloned schedules. Cheap because clone already exists.
4. **Lifecycle guards** (bug #4) — small, protects data integrity for everything downstream.
5. Longer term: **feed observed running times back** into `*Calculated` columns once stage 7
   exists, and surface "scheduled vs. observed" diffs to the timetabler.

**Verdict: 🟢 rich, GTFS-grade timetable model with standout authoring UX; 🔴 no frequency
concept, no demand input, no feedback loop — timetables are authored blind and never
recalibrated.**
