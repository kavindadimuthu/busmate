# ADR-024 · Who normally works a departure is its own record, separate from schedule and trip

**Date:** 2026-09-25 · **Status:** Proposed
**Type:** architecture

## Context

Every line of the Embilipitiya post states who normally runs a departure: `01:15 Weerasinghe Midnight
Express ND-1712`. BusMate has nowhere above `Trip` to put that. `Schedule` knows a route and times;
`trip.bus_id` exists once per calendar date, so recording one fact means generating and touching dozens of
trip rows. Two things make that worse than inconvenient:

- **The fact cannot be entered at all.** A `Bus` requires `operator_id`, `capacity` and
  `ntc_registration_number`, all `NOT NULL`, none knowable from a timetable board.
- **Manual assignment is guarded, and a default would collide with the guards.** `assignBusToTrip` requires
  the bus to be active, its operator to match the trip's permit, it to be available that day (INC-020),
  authorised under the permit, and not overlapping another trip; and it refuses outright when the trip
  "already has a bus". A default bus written naively would bypass all five and then block the operator from
  correcting it on the day.

The post also shows what a single "working" row cannot be. `Rajapakse Gem NA-9245 & Dakshina Super Line
NC-0965 (rotation)` is **two vehicles from two operators** alternating on one departure with no stated
order. Jayamini Travels runs both a normal `NC-2881` and a semi-luxury `ND-1869` on the same route, so class
belongs to the departure's working, not to the operator or the vehicle.

## Options considered

1. **Add operator and vehicle columns to `Schedule`.** Mixes two provenance stories in one row: a time can be
   official while the vehicle claim is a passenger's report, and record-level provenance
   ([ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)) cannot say both.
2. **Materialise trips for every date and assign each.** The status quo; the fan-out is the problem.
3. **A template between `Schedule` and `Trip`, held as claims that may be unresolved.** *(chosen)*

## Decision

**Option 3.** Two new tables, and two nullable columns on `trip`.

```mermaid
erDiagram
    SCHEDULE ||--o{ SCHEDULE_WORKING : "normally worked by"
    SCHEDULE_WORKING ||--o{ SCHEDULE_WORKING_VEHICLE : "vehicle(s)"
    SCHEDULE_WORKING }o--o| OPERATOR : "resolved, optional"
    SCHEDULE_WORKING_VEHICLE }o--o| BUS : "resolved, optional"
    SCHEDULE ||--o{ TRIP : "per date"
    TRIP }o--o| SCHEDULE_WORKING : "source_working_id (audit only)"
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
    TRIP {
        uuid source_working_id "null if no default applied"
        string assignment_source "DEFAULTED or MANUAL; null before this ADR"
    }
```

- **Claims, not foreign keys.** A contributor records what they saw — a plate string, an operator name — and
  staff resolve it to a `Bus` or `Operator` later. An unresolved claim is valid, publishable and labelled
  *reported*; it is not an error state. `Bus` keeps every requirement it has, because those are fleet-registry
  facts. A row must name a `bus_id` or a `plate_observed`; a working must name an operator or an
  `operator_name_observed` unless it has vehicles or a class to assert (checked in the service, since a
  `CHECK` cannot look across tables).
- **Operator and vehicle are separate records with separate provenance.** A certain plate under an uncertain
  operator name (`NB-4093 (Sayam Kirilli)`) needs two tiers, which record-level provenance can only give by
  making them two rows. Both carry the same provenance columns as `schedule`, written through
  `ProvenanceStamper`.
- **Several vehicles mean "one of these", with no order asserted.** The post never says which runs on which
  day, so no `rotation_position` exists to invent one. Two operators on one departure are two workings for the
  same schedule and dates; the non-overlap rule is per operator, not per schedule.
- **Working records are immutable once approved.** A change of operator or vehicle is a new working with its
  own effective dates, so history is the chain of rows.
- **No overlap for the same operator.** No two workings for one schedule may overlap in date if they name the
  same operator (by id, or by observed name when unresolved). A unique index on
  `(schedule_id, operator key, effective_start_date)` backstops the service check. This is the first conflict
  validation anywhere in the scheduling model.
- **`Trip` keeps its meaning: it is the sole authority on what runs on a date.** At generation, a working
  seeds a trip's bus only when **exactly one** working covers that date, it has **exactly one** vehicle, that
  vehicle is **resolved** to a bus, and the assignment **passes the same guards manual assignment applies**
  (active, available that day, no overlap). Otherwise the trip's bus stays empty. The default is never a
  guess: a rotation, an unresolved plate or a guard failure leaves the bus blank rather than showing a
  possibly wrong one. Permits are legal instruments and are never seeded.
- **Resolved at generation, never at read.** Editing a working never rewrites trips that already exist;
  regeneration is an explicit staff action. `trip.source_working_id` (`ON DELETE SET NULL`) records which
  working supplied a default, and `trip.assignment_source` says `DEFAULTED` or `MANUAL`. Existing trips are
  `NULL` in both, meaning they predate this record and nothing is claimed about them.
- **A defaulted bus can be replaced; a manual one cannot.** `assignBusToTrip` may replace a `DEFAULTED` bus
  (and sets `MANUAL`), so the operator can correct the day; it keeps refusing when the bus was assigned
  manually. A bus that differs from the working's vehicle is the exception, and is derivable, so it needs no
  third state.
- **A default is never presented as a fact.** Anything derived from a working reaches a passenger as
  "usually …", labelled by its provenance through `TrustLabels`; only a `MANUAL` assignment or an observed
  fact reads as confirmed.
- **Contributions arrive as changesets** of a new `SCHEDULE_WORKING` type, carrying observed strings only;
  approval writes the working at `SRC_4`. Because a working is its own record, it does not collide with an
  official schedule's time: the tier conflict [ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)
  refuses today (`ChangesetReviewService`) does not arise, which is what lets an official time and a
  community plate coexist on one service.

## Consequences

- **The fan-out disappears for entry.** One departure is one working, however many days are generated; the
  Embilipitiya post becomes about 230 workings rather than tens of thousands of trip edits.
- **A trip with a permit and a defaulted bus needs an answer.** If a permit is later assigned to a trip and the
  defaulted bus is not authorised under it, the default should be dropped rather than block the assignment.
  The permit-assignment code is not read here; this is settled in the increment that builds it.
- **Tenancy.** New operator-scoped data carries `operator_id` from its first migration
  ([context.md](../context.md), invariant 4). Here it is nullable by design, because an unresolved working has
  no operator to belong to. When core-service gets row-level security, unresolved workings must be treated as
  unowned (visible to staff and to the community flow), not silently hidden or shown to every operator. A
  reviewer should confirm that reading before the migration is written.
- **`Trip.bus_id` stays authoritative**, so ticketing-service (which stores the bus on every ticket) and
  conductor-mobile (which opens the trip's seat map) are unaffected.
- **Not decided here, each its own record:** operators' booking contacts, which repeat across departures
  (`0777143700` appears on three); through-running and short-working services, which are probably separate
  schedules with a link, not an override on this record; versioned fares; and proposing routes and schedules.
- **Additive:** two tables, two nullable `trip` columns, and a change to `assignBusToTrip`. No existing row is
  touched and no backfill is needed.

## Revisit when

- Rotations turn out to need an order (odd/even days, a fixed cycle), which would mean the vehicle rows need
  structure beyond "one of these".
- Workings are rarely resolved to buses, so the seeding rule almost never fires and the record mostly serves
  display, which would argue for dropping trip seeding.
- Operators start maintaining their own workings on the platform, which changes who owns the record and how
  it is scoped.
