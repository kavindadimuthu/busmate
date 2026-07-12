# S3 — Operations & Trip Execution

> Reference section (first captured, 2026-07-11) demonstrating the audit structure. Grounded in a
> full read of the `operations` package (both controllers, `Trip` entity, `TripStatusEnum`, and the
> 1219-line `TripServiceImpl`), cross-checked against
> [route-network-and-operations/trips.md](../../../route-network-and-operations/trips.md).

**Maturity summary:** 🟢 The trip lifecycle is genuinely built and live-verified end-to-end
(generate → assign PSP/bus/conductor → conductor start/complete → ticketing). But it is **thin on
correctness guards**: trip generation ignores the calendar/exception model, status transitions are
largely unguarded, the generic lifecycle endpoints have no ownership check, and there is no
double-booking or per-stop actuals capture. S3 *records and executes* the day-of-operations
correctly on the happy path, but does not yet *protect* the data or *feed back* actuals.

**Scope (owns):** trip materialisation from schedules; PSP/bus/conductor assignment; trip lifecycle
(start/complete/cancel/status); conductor self-service; trip stats & filter options.
**Out of scope (owned elsewhere):** schedules/calendars → S2 · permits/operators/buses → S4 ·
tickets on a trip → S5 · passenger-facing trip queries → S6 · live position/timekeeper → S7.
**Code roots:** `apps/backend/core-service/src/main/java/com/busmate/routeschedule/operations/`
(`controller/TripController.java`, `controller/ConductorController.java`, `entity/Trip.java`,
`enums/TripStatusEnum.java`, `service/impl/TripServiceImpl.java`, `repository/TripRepository.java`).
Operator-side assignment: `fleet/controller/BusOperatorController.java`.
**Source docs:** [trips.md](../../../route-network-and-operations/trips.md),
[workflows/trips-workflows.md](../../../route-network-and-operations/workflows/trips-workflows.md),
[transit-workflow-evaluation/06-operations-execution.md](../../../transit-workflow-evaluation/06-operations-execution.md).
**Live-verify how:** log in via api-gateway as a seeded operator
([operator-conductor-seed-credentials.md](../../../operator-conductor-seed-credentials.md)) →
generate trips for a schedule → assign PSP + bus + conductor → log in on conductor-mobile → start &
complete that trip → confirm status + `actualDepartureTime/actualArrivalTime` persisted.

## Files in this section

| File | Stage | Contents |
|------|-------|----------|
| [current-state.md](current-state.md) | Capture | class diagram, data model, trip state machine, API surface |
| [workflows.md](workflows.md) | Capture | 4 sequence diagrams (generate, assign, conductor-execute, generic-lifecycle) |
| [capabilities.md](capabilities.md) | Capture | 9 capabilities (C-S3-01…09) |
| [gaps-and-improvements.md](gaps-and-improvements.md) | Identify + Analyze | 12 gaps (G-S3-01…12) → 12 improvements (I-S3-01…12) |
| [backlog.md](backlog.md) | Prioritize + Manage | ranked backlog, 5 P0s, quadrant |

## Section maturity table

| Capability | Maturity | Evidence |
|---|---|---|
| C-S3-01 Generate trips | 🟡 wrong days | ✅ code |
| C-S3-02 Query/filter/paginate | 🟢 | ✅ code + live |
| C-S3-03 Assign PSP/bus/conductor | 🟢 (no overlap check) | ✅ code + live |
| C-S3-04 Lifecycle transitions | 🟡 guards missing | ✅ code |
| C-S3-05 Conductor self-service | 🟢 (generic eps unguarded) | ✅ code + live |
| C-S3-06 Statistics | 🟡 one mock metric | ✅ code |
| C-S3-07 Actual-time capture | 🔴 trip-level only | ✅ code |
| C-S3-08 Delete trip | 🟡 unsafe | ✅ code |
| C-S3-09 Driver assignment | 🔴 stub | ✅ code |

## Capture progress

- [x] current-state (class + ER + state machine + API surface)
- [x] workflows (4 sequences)
- [x] capabilities inventory (9)
- [x] gaps identified + analyzed (12 → 12)
- [x] backlog seeded (12) + escalations pushed to root roll-up
