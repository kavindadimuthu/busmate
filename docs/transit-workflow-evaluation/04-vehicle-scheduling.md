# Stage 4 — Vehicle Scheduling

**What this stage means in transit practice:** assigning vehicles to the timetable — chaining
trips into *blocks* (one vehicle's work for a day), minimising fleet size and dead-heading,
respecting depot locations, vehicle types, refuelling/charging, and maintenance windows.

## An important framing: BusMate's decentralised model

Classical vehicle scheduling assumes a centralized agency optimising its own fleet. BusMate
models the Sri Lankan reality instead: **MOT generates trips and attaches PSP permits; each
private operator assigns their own buses to their own permitted trips.** There is no global
fleet to optimise — so the fair evaluation is "does BusMate help each operator assign well and
prevent invalid assignments", not "does it solve the vehicle scheduling problem".

## What BusMate has today

- **Bus registry** (`fleet.Bus`): NTC registration number, plate, capacity, model, facilities
  (jsonb), **seat layout** (jsonb, defaulted from capacity — feeds ticketing seat maps), status;
  owned by an `Operator`. Operator sees a read-only Fleet page; MOT has full bus CRUD.
- **Permit gating** (`licensing`): `PassengerServicePermit` + bus↔permit assignments tie
  operators to route groups; trip visibility for operators flows through the permit link
  (ownership-checked at the API — live-verified).
- **Per-trip bus assignment**: operator picks a bus for each trip in the operator portal's trips
  page (`Trip.busId`). MOT bulk/single PSP-to-trip assignment exists.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **No double-booking prevention** | High | Nothing stops assigning the same bus to two overlapping trips (known gap #7 in the route-network list). This is the single most important validation missing at this stage — it makes the assignment data untrustworthy for anything downstream. |
| **No block/chain concept** | Medium | Every trip is assigned independently. An operator running 8 trips/day per bus re-picks the bus 8 times; there's no "this vehicle's day" view, no turnaround-time awareness (bus arriving at B at 10:00 can't depart A at 10:05). |
| **No depot/home-base for buses** | Medium | Follows from stage 1's missing depot entity; dead-head feasibility can't be expressed. |
| **No maintenance / availability model** | Medium | Bus `status` is a flat enum; no scheduled-maintenance windows, so an unavailable bus is still assignable. |
| **No assignment assistance** | Medium | The UI offers the operator's full bus list; it doesn't filter to *available* buses (no overlapping trip, capacity ≥ expected load, permit-valid) or suggest one. |
| No vehicle-type ↔ route constraints | Low | E.g. expressway routes requiring specific vehicle classes; `roadType` exists on routes but nothing links it to bus attributes. |
| Fleet analytics mock | — | Covered in [stage 8](08-analysis-feedback.md). |

## Improvement candidates

1. **Overlap validation on bus assignment** — reject (or warn) when the bus already has a trip
   whose scheduled window intersects, with a configurable turnaround buffer. Small query, huge
   trust gain. Do the same for conductors (stage 5) in the same pass.
2. **"Bus day" view** for operators — all of one bus's trips on a date, in time order, with
   gap/overlap highlighting. This is 80% of a blocking tool with none of the optimisation.
3. **Availability-filtered assignment picker** — only offer buses that pass the overlap check and
   are in an assignable status.
4. **Maintenance windows** on `Bus` (simple `unavailable_from/to` records) feeding the same
   filter.
5. Defer true optimisation (min-fleet blocking, dead-head planning) — wrong fit for the
   decentralised model until operators are large enough to want it.

**Verdict: 🟡 the registry and permission model are solid and live-verified, but "scheduling" is
a manual, unvalidated per-trip picker — no conflict checks, no vehicle-day concept, no
availability model.**
