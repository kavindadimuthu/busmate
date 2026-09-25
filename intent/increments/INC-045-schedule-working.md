---
id: INC-045
title: Staff can record who normally works a departure, from a plate and a name as seen
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A departure can carry who normally works it — an operator, a service class, one or more vehicles — recorded
from what someone saw on a board, without a registered operator or bus behind it, and linked to real ones
later by staff.

## Why now

[ADR-024](../decisions/ADR-024-a-departures-normal-working-is-its-own-record.md) is accepted. Every line of
the Embilipitiya post states this and BusMate has nowhere to put it: `Bus` cannot be created from a plate
alone, and the only vehicle field is on a per-date trip.

## Acceptance criteria

- [x] A working can be recorded from an operator name and a plate as seen, with neither registered.
- [x] A request must say something, and a vehicle must name a plate or a registered bus.
- [x] Several vehicles are kept as "one of these"; the same vehicle twice is refused.
- [x] Two operators on one departure are two workings; one operator cannot overlap itself, by name without
      regard to case, and ending a working frees its dates.
- [x] Staff can link a name to a registered operator and a plate to a registered bus, and what was seen is kept.
- [x] A bus registered to one operator cannot be another operator's vehicle, at creation or on linking.
- [x] Linking two names that turn out to be one operator is refused if they would then overlap.
- [x] Only staff can record, read or remove workings.
- [x] Generating trips never puts a working's bus on them.
- [x] Tests named INC-045 cover each, against real Postgres.

## Out of scope

- Showing a working to passengers and staff (INC-046), importing them in bulk from a spreadsheet, and
  contributor proposals of workings.
- Anything on `Trip`. A working is display-only; assigning "usual vehicles" to trips is deferred by ADR-024.
- Booking contacts, through-running and fares, which ADR-024 leaves to their own records.

## Constraints

- Migration `V013` adds two tables and touches no existing row; it is not run against any shared environment
  by an agent.
- `operator_id` is nullable by design, so when core-service gets row-level security an unresolved working is
  unowned (ADR-024).
- The overlap check runs before a change is applied, not after: it queries, and a query flushes pending changes,
  which let the unique index refuse first as a 500. The index remains the backstop.

## Decisions

- See ADR-024
