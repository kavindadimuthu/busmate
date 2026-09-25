# ADR-024 · Who normally works a departure is its own record, separate from schedule and trip

**Date:** 2026-09-25 · **Status:** Accepted
**Type:** architecture

## Context

Every line of the Embilipitiya post states who normally runs a departure: `01:15 Weerasinghe Midnight
Express ND-1712`. BusMate has nowhere to put that. `Schedule` knows a route and times; the only place a vehicle
lives is `trip.bus_id`, which exists once per calendar date. Two things make that unworkable for this data:

- **The fact cannot be entered at all.** A `Bus` requires `operator_id`, `capacity` and
  `ntc_registration_number`, all `NOT NULL`, none knowable from a timetable board.
- **It is a claim about a pattern, not about a day.** "ND-1712 normally runs the 01:15" is true across months;
  recording it by touching tens of trip rows per departure is the wrong shape.

The post also shows what a single "working" row cannot be. `Rajapakse Gem NA-9245 & Dakshina Super Line
NC-0965 (rotation)` is **two vehicles from two operators** alternating on one departure with no stated
order. Jayamini Travels runs both a normal `NC-2881` and a semi-luxury `ND-1869` on the same route, so class
belongs to the departure's working, not to the operator or the vehicle.

## Options considered

**For where the fact lives**

1. **Operator and vehicle columns on `Schedule`.** Mixes two provenance stories in one row: a time can be
   official while the vehicle claim is a passenger's report, and record-level provenance
   ([ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)) cannot say both.
2. **Assign a vehicle to every generated trip.** The status quo; the fan-out is the problem.
3. **A separate record between `Schedule` and `Trip`.** *(chosen)*

**For an operator BusMate has not heard of**

1. **Store the name as seen; link to a real operator later.** *(chosen)* A wrong spelling is a one-word edit.
2. **Create an "unclaimed" `Operator` row automatically.** Technically easy — the operator table is small and
   `user_id` is nullable — but it fills the registry with unverified guesses: "Weerasinghe Express" and
   "Weerasinghe Midnight Express" become two operators, and the fix is merging entities (and whatever hangs
   off them), which BusMate has no tool for and has chosen not to build.
3. **Require a registered operator.** Blocks the data: most of the ~60 private operators in the post are not
   on the platform.

**For whether a working writes a default bus onto generated trips**

1. **Seed automatically at generation.** Rejected for now. Manual assignment (`assignBusToTrip`) applies five
   checks — the bus is active, its operator matches the trip's permit, it is available that day (INC-020), it
   is authorised under the permit, it does not overlap another trip — and refuses a trip that "already has a
   bus". Seeding would have to repeat every check, and would force the "already has a bus" rule to
   distinguish an automatic bus from a manual one. It also helps only operators who are on the platform with
   registered buses; a community-recorded plate is text, not a bus, so there is nothing to seed. There are no
   live tenants.
2. **Display only.** *(chosen)* Workings are read by passengers and staff; trips are untouched.
3. **An explicit "assign usual vehicles" action.** *(deferred, not rejected)* Calls the ordinary assignment
   path per trip, so every check runs for free and a failure is reported per trip. It is the right next step
   once operators use the platform, and needs no change to this record.

## Decision

Two new tables. **`Trip` is not changed by this ADR.**

```mermaid
erDiagram
    SCHEDULE ||--o{ SCHEDULE_WORKING : "normally worked by"
    SCHEDULE_WORKING ||--o{ SCHEDULE_WORKING_VEHICLE : "vehicle(s)"
    SCHEDULE_WORKING }o--o| OPERATOR : "resolved, optional"
    SCHEDULE_WORKING_VEHICLE }o--o| BUS : "resolved, optional"
    SCHEDULE_WORKING {
        date effective_start_date
        date effective_end_date "null = current"
        uuid operator_id "null until resolved"
        string operator_name_observed "as seen, e.g. Weerasinghe Midnight Express"
        string service_class "ServiceClassEnum vocabulary, optional"
        provenance "source_tier, observed_at, confidence, credit"
    }
    SCHEDULE_WORKING_VEHICLE {
        uuid bus_id "null until resolved"
        string plate_observed "as seen, e.g. ND-1712"
        provenance "its own, not the working's"
    }
```

- **Claims, not foreign keys.** A contributor records what they saw — a plate, an operator name — and staff
  resolve it to a `Bus` or `Operator` later. An unresolved claim is valid, publishable, and labelled
  *reported*; it is not an error state. `Bus` keeps every requirement it has, because those are fleet-registry
  facts. A vehicle row names a `bus_id` or a `plate_observed` (a `CHECK`); a working names an operator or an
  `operator_name_observed` unless it has vehicles or a class to assert (checked in the service, since a
  `CHECK` cannot look across tables).
- **Operator and vehicle are separate records with separate provenance.** A certain plate under an uncertain
  operator name (`NB-4093 (Sayam Kirilli)`) needs two tiers, which record-level provenance can only give by
  making them two rows. Both carry the same provenance columns as `schedule`, written through
  `ProvenanceStamper`.
- **Several vehicles mean "one of these", with no order asserted.** The post never says which runs on which
  day, so no rotation order exists to invent. Two operators on one departure are two workings for the same
  schedule and dates; the non-overlap rule is per operator, not per schedule.
- **Working records are immutable once approved.** A change of operator or vehicle is a new working with its
  own effective dates, so history is the chain of rows.
- **No overlap for the same operator.** No two workings for one schedule may overlap in date if they name the
  same operator — by id, or by observed name (case-insensitive) when unresolved. A unique index on
  `(schedule_id, operator key, effective_start_date)` backstops the service check. This is the first conflict
  validation anywhere in the scheduling model.
- **Staff resolve; contributors do not.** Linking a claim to a `Bus` or `Operator` is a staff action, so an
  unverified guess never becomes a fleet-registry reference on a contributor's say-so.
- **A working is never shown as a confirmed fact.** It reaches a passenger as "usually …", labelled by its
  provenance through `TrustLabels`. Nothing here is written onto a trip, so a trip's bus is only ever what an
  operator assigned.
- **Contributions arrive as changesets** of a new `SCHEDULE_WORKING` type, carrying observed strings only;
  approval writes the working at `SRC_4`. Because a working is its own record, it does not collide with an
  official schedule's time: the tier conflict [ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)
  refuses today does not arise, which is what lets an official time and a community plate coexist on one
  service.

## Consequences

- **Entry stops being per trip.** One departure is one working, however many days are generated; the
  Embilipitiya post becomes about 230 workings.
- **Operators get nothing new yet.** They still assign buses trip by trip; the "assign usual vehicles" action
  above is what would change that, and it can be built without altering this record.
- **Tenancy.** New operator-scoped data carries `operator_id` from its first migration
  ([context.md](../context.md), invariant 4). Here it is nullable by design, because an unresolved working has
  no operator to belong to. When core-service gets row-level security, an unresolved working is **unowned**:
  visible to staff and the community flow, not hidden, and not shown to every operator. A resolved working is
  a claim *about* an operator, not the operator's own data.
- **`Trip` and everything reading it are unaffected**: ticketing-service, conductor-mobile, permits and the
  assignment guards do not change.
- **Not decided here, each its own record:** operators' booking contacts, which repeat across departures
  (`0777143700` appears on three); through-running and short-working services, which are probably separate
  schedules with a link, not an override on this record; versioned fares; proposing routes and schedules.
- **Additive:** two tables. No existing row is touched and no backfill is needed.

## Revisit when

- Operators are on the platform and assigning buses trip by trip is their complaint, which is the trigger for
  the "assign usual vehicles" action, and then for reconsidering automatic seeding.
- Rotations turn out to need an order (odd/even days, a fixed cycle), which would mean the vehicle rows need
  structure beyond "one of these".
- Unresolved workings are almost never resolved, which would argue for a proper operator-matching tool.
