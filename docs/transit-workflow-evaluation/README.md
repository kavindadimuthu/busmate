# BusMate vs. the Public-Transport Planning Pipeline

Public transport is classically organised as a pipeline of planning and operational stages,
each feeding the next: strategic decisions made years ahead narrow into tactical decisions made
months ahead, then into operational decisions made days or minutes ahead, and finally into
feedback loops that inform the next planning cycle.

This doc set evaluates **how BusMate handles each stage today**, grounded in the actual code
(core-service, ticketing-service, user-service, api-gateway, new-react-portal, the two Expo
apps), and identifies limitations, gaps and improvement candidates per stage.

## The stages and where to read about them

| # | Stage | Horizon | Doc | BusMate maturity |
|---|---|---|---|---|
| 1 | Infrastructure planning | Strategic (years) | [01-infrastructure-planning.md](01-infrastructure-planning.md) | 🔴 Absent (mostly out of scope) |
| 2 | Network design | Strategic (years) | [02-network-design.md](02-network-design.md) | 🟢 Strong for registry, 🟡 weak for *design* |
| 3 | Frequency setting & timetabling | Tactical (months) | [03-frequency-setting-timetabling.md](03-frequency-setting-timetabling.md) | 🟢 Rich timetable model, 🔴 no frequency/demand tooling |
| 4 | Vehicle scheduling | Tactical (weeks) | [04-vehicle-scheduling.md](04-vehicle-scheduling.md) | 🟡 Manual per-trip assignment only |
| 5 | Crew scheduling | Tactical (weeks) | [05-crew-scheduling.md](05-crew-scheduling.md) | 🟡 Conductor per-trip only; driver missing |
| 6 | Operations execution | Operational (day-of) | [06-operations-execution.md](06-operations-execution.md) | 🟢 Real end-to-end, with known bugs |
| 7 | Monitoring (real-time) | Operational (minutes) | [07-monitoring.md](07-monitoring.md) | 🔴 UI shells on mock data; no AVL |
| 8 | Analysis & feedback | Retrospective | [08-analysis-feedback.md](08-analysis-feedback.md) | 🔴 All analytics mock; real data exists but unqueried |

Legend: 🟢 substantially implemented · 🟡 partially implemented / manual only · 🔴 not really implemented

## The one-paragraph verdict

BusMate is at heart a **service-registry and day-of-operations execution platform**, not a
planning platform. The middle of the pipeline — network registry, timetables with calendars and
exceptions, trip materialisation, permit-gated operator assignment, conductor execution,
ticketing — is genuinely built, wired end-to-end and largely live-verified. The two ends of the
pipeline are thin: upstream there is **no planning support** (no demand data, no design
analysis, frequencies are implicit in hand-authored timetables), and downstream the **feedback
loop is broken** (no actual-time capture at stops, no vehicle positions, and every analytics
screen renders generated mock data even though real tickets and trips sit in the databases).
This shape is defensible for the Sri Lankan context BusMate targets — a ministry registering a
privately-operated network and digitising its execution — but it means the system can *record*
the network, not yet *improve* it.

## Cross-cutting themes (recur in almost every stage)

1. **The feedback loop is the single biggest structural gap.** Stages 7–8 produce the data that
   stages 2–5 need (running times, loads, on-time performance). Nothing captures per-stop
   actuals or positions, so nothing downstream can inform anything upstream. The
   `ScheduleStop.*Unverified/*Calculated` columns and the unused trip statuses
   (`boarding`/`departed`/`delayed`) show this loop was *anticipated* in the model but never built.
2. **UI-first development left mock shells.** Tracking, analytics, revenue analytics, fares,
   policies, timekeeper, salaries — complete polished UIs over `data/**/*.ts` generators. Each
   is listed in its stage doc; collectively they overstate the platform's real capability.
3. **No conflict/constraint validation.** The same bus or conductor can be assigned to
   overlapping trips; overlapping schedules on a route are not detected; lifecycle transitions
   are unguarded. Every scheduling stage shares this weakness.
4. **Decentralised-operator model is a deliberate constraint, not an accident.** MOT authors the
   network and timetables; private operators (via PSP permits) supply vehicle and crew per trip.
   Classic centralized optimisation (vehicle blocking, crew rostering) applies differently here —
   the realistic improvements are *assistance and validation* for operators, not global optimisers.

## Relationship to existing docs

This set is the workflow-stage view. Domain-level deep dives already exist and are referenced
throughout:

- [docs/route-network-and-operations/](../route-network-and-operations/README.md) — stops,
  routes, schedules, trips internals + its own gap list
- [docs/passenger-information/](../passenger-information/README.md) — find-my-bus and passenger
  querying
- [docs/user-management/](../user-management/) — roles, permissions, auth
