---
id: INC-020
title: Assigning a bus or conductor to a trip is guarded, and an operator can report a trip won't run
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A bus or conductor can be put on a trip only when the ownership, availability, and permit-link
checks actually hold, and never on two overlapping trips at once. An operator can report their own
pending trip won't run, with a reason; MOT sees it and can reinstate the trip.

## Why now

Confirmed while reviewing the assignment endpoints: `assign-bus` checked that the bus belonged to
the calling operator but never checked that the **trip** did — any operator could put their own
bus on any other operator's trip just by knowing its id. Neither assignment endpoint checked bus
availability, the permit link, or overlapping trips at all — the exact "no double-booking
validation" and "no conflict/constraint validation anywhere" gaps flagged in the backlog and in
context.md's cross-cutting themes. `assignConductorToTrip`'s own comment said ownership was
"enforced by the caller" and nothing else.

## Design

- **The ownership check that was missing** is added to `BusOperatorController.assignBusToTrip`,
  matching the pattern already used by assign-conductor/remove-bus/remove-conductor: the trip's
  derived operator (from its permit, or its bus once one is set) must equal the caller's own
  operator, or the request 404s.
- **Guards live in `TripServiceImpl`**, not just the controller, so they hold for every caller:
  - only a `pending` trip can have its bus or conductor changed;
  - the bus must be active, available on the trip's date (`Bus.isAvailableOn`, INC-018), and — once
    the trip has a permit — linked to that permit and in force (`PermitBusLinks`, INC-017);
  - the conductor is checked with user-service via `ConductorDirectory` (already built for INC-019):
    must be active and belong to the trip's operator;
  - neither the bus nor the conductor may already be on another, non-cancelled trip on the same day
    whose scheduled window overlaps this one (a 10-minute turnaround buffer either side).
- **An operator reports their own trip won't run** (design R7) through a new
  `PATCH /api/v1/bus-operator/{operatorId}/trips/{tripId}/cancel` — pending only, reason required,
  ownership-checked the same way. MOT sees the reason on the trip and can reinstate it
  (`PATCH /api/trips/{id}/reinstate`, pending only, un-cancels), or cancel any trip directly as
  before.

## Acceptance criteria

- [ ] An operator cannot assign their own bus to a trip belonging to another operator's permit.
- [ ] Assigning a bus refuses one that is unavailable that day, not linked to the trip's permit,
      or already on an overlapping trip; the same trip can still take a second, non-overlapping
      assignment.
- [ ] Assigning a conductor refuses an inactive account, one working for a different operator, or
      one already on an overlapping trip.
- [ ] Neither assignment is possible once the trip has left `pending`.
- [ ] An operator can cancel only their own pending trip, with a reason; cancelling twice, or a
      trip that isn't pending or isn't theirs, is refused.
- [ ] MOT reinstates a cancelled trip back to pending.
- [ ] Tests named INC-020 cover the above against real Postgres.

## Out of scope

- Bulk assignment across a date range (backlog candidate, not built here).
- A readiness dashboard surfacing unassigned/at-risk trips (backlog candidate).
- Rewriting `cancelTrip` to keep a separate cancellation-reason field instead of overwriting
  `Trip.notes` — a pre-existing issue, untouched here beyond guarding against a double-cancel.
