---
id: INC-021
title: A ticket is scoped to the operator it was sold for, not to a filter the caller sends
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Every ticket records which operator it was sold under, decided at the moment of sale by facts
ticketing-service asks core-service for — never by a filter the caller sends. The admin sales
listing is scoped to the caller's own operator when they are one; MOT and admin see everything;
anyone else is refused outright.

## Why now

Confirmed while reviewing `TicketController.getAllTickets` (design doc §7, R8): the endpoint took
no identity at all — a signed-in passenger could call it and list every ticket in the system — and
its only scoping mechanism was a `busIds` query parameter the *browser* supplied, which the
operator portal populated from its own fetched bus list. That is not a security boundary (any
caller could send any ids, or none), and it would also have been historically wrong the day a bus
changed operators.

## Design

- **`Tickets.operator_id`** is set once, at creation, and never re-derived. For an online booking
  it comes free from core-service's existing booking-context call (`InternalBookingContextResponse`
  now also returns the bus's operator). For a conductor-issued ticket, a new best-effort call
  (`GET /internal/operators/by-bus/{busId}`) resolves it; this lookup never blocks a sale — a
  conductor collecting a fare must not fail because a lookup timed out, so a miss just leaves the
  ticket unscoped rather than unsold.
- **The sales listing resolves its own scope.** `TicketController.getAllTickets` reads the
  gateway-verified identity headers (the same pattern the rest of this controller already used for
  ownership checks) and calls `resolveTicketListScope`: admin/mot get no restriction, an operator
  gets their own core-service Operator id (via the same `/internal/operators/by-user/{userId}`
  INC-016 added, now also called from ticketing-service) or is refused if it can't be confirmed,
  and everyone else — a passenger, a conductor, an unauthenticated request — is refused outright.
  The client-sent `busIds` filter still exists for staff's own convenience but can no longer widen
  or escape an operator's scope.
- **Demo data backfilled**, not left silently invisible: a dev-seed migration (V907) assigns
  `operator_id` to the tickets seeded before this column existed, from core-service's fixed
  bus-operator registry — the same ids the demo seed already relies on elsewhere.

## Acceptance criteria

- [ ] An operator's ticket listing contains only tickets sold under their own operator, however
      `busIds` is set.
- [ ] MOT and admin see every operator's tickets.
- [ ] A passenger or conductor account, or a request with no identity, cannot reach the listing.
- [ ] An operator account whose own operator link cannot be confirmed is refused, not shown
      everything.
- [ ] A conductor-issued ticket is stamped with its bus's operator; an online booking is stamped
      from the same booking-context call that already prices it.
- [ ] Tests named INC-021 cover the above against real Postgres.

## Out of scope

- Backfilling or scoping `getTicketsByBusId`/`getTicketsByTripId`/`getConductorLogs` — narrower
  lookups that need the id already, not the enumerable listing this fixes.
- Re-deriving an existing ticket's operator if its bus is later sold to someone else (by design:
  history stays with whoever it was sold under).
