# Stage 5 — Crew Scheduling

**What this stage means in transit practice:** turning vehicle blocks into *duties* (a
driver/conductor's shift, respecting labour rules: max driving hours, breaks, sign-on/off), then
*rostering* duties to actual people over weeks (days off, fairness, leave), plus day-of
attendance and standby cover.

As with vehicles ([stage 4](04-vehicle-scheduling.md)), BusMate's decentralised model applies:
each operator manages their own crew; the realistic bar is assignment support + validation, not
duty optimisation.

## What BusMate has today

- **Conductor identity is real and well-built**: conductors are user-service users
  (admin/operator-provisioned, deliberately no self-registration), linked to an operator.
  The operator portal has a real conductor-only **Crew CRUD** page (live-verified).
- **Per-trip conductor assignment**: operator assigns a conductor to a trip
  (`Trip.conductorId`); ownership-checked. Conductor-mobile then shows the person exactly their
  assigned journeys via ownership-checked self APIs (live-verified).
- That's the whole stage. Everything else is missing or mock.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **Driver doesn't exist** | High | `Trip.driverId` is a bare UUID column with queries but no entity, no assignment endpoint, no UI (known half-built item). In a two-person-crew system, half the crew is unmodellable. |
| **No double-booking prevention** | High | Same conductor can be assigned to overlapping trips; mirrors the bus gap and should be fixed together. |
| **No duty/shift concept** | Medium | Assignment is per trip; no notion of a shift, break, or max daily hours. No labour-rule validation of any kind (even "warn if this conductor's assigned trips span > 12 h" doesn't exist). |
| **No roster / availability** | Medium | No days-off, leave, or availability calendar; the assignment picker offers every conductor, including ones who (in reality) aren't working that day. |
| **Attendance is mock** | Medium | The timekeeper portal has an attendance page rendered from mock data; no real sign-on/sign-off exists anywhere, so "did the crew actually show up" is unrecorded. |
| **Salaries page is mock** | Low | Operator portal salaries UI has no backend; conductor pay linked to worked trips would be a natural consumer of real attendance + trip data. |
| No standby/relief workflow | Low | When a conductor no-shows, the recovery is silent manual re-assignment; nothing flags unstaffed imminent trips. |

## Improvement candidates

1. **Overlap validation for conductor assignment** — same mechanism as the bus check in stage 4;
   implement both in one pass over trip scheduled windows.
2. **Promote Driver to a first-class crew member** — reuse the conductor pattern wholesale
   (user-service role exists conceptually; operator Crew page already does conductor CRUD).
   Decide explicitly if the MVP is conductor-only, and if so drop the dead `driverId` column
   rather than keeping a half-feature.
3. **"Crew day" view + unstaffed-trip alert** — per conductor per date, trips in time order
   (mirrors the bus-day view); plus a dashboard tile "trips in the next 24 h with no
   conductor/bus", which is cheap and operationally the most valuable item here.
4. **Real attendance** — the timekeeper rebuild ([stage 6](06-operations-execution.md) /
   route-network gap list) should record sign-on; conductor-mobile's trip-start already
   implicitly proves presence and could stamp attendance for free.
5. Defer duty generation/rostering/labour-rule engines until operators demand them.

**Verdict: 🟡 conductor identity, ownership and per-trip assignment are real and verified — a
solid skeleton; but drivers are missing entirely, there are no duties/rosters/labour checks, no
double-booking prevention, and attendance/payroll are mock UIs.**
