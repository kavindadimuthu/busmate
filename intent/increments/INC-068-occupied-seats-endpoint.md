---
id: INC-068
title: Occupied-seats endpoint for passenger seat selection
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A passenger choosing seats can be told which seats on a trip are taken, without being able to read anyone else's
ticket, fare or payment.

## Why now

Seat selection in passenger-web v2 (INC-069, to be shaped) needs
it, and the only source today is the full trip ticket list, which any signed-in user can read
([ADR-030](../decisions/ADR-030-a-seat-map-learns-which-seats-are-taken-and-nothing-more.md)).

## Acceptance criteria

- [x] `GET /api/v1/tickets/trip/{tripId}/occupied-seats` returns the trip's taken seat labels, sorted, and
      only those: nothing about tickets, people, fares or payment.
- [x] A cancelled ticket's seat is not listed; another trip's seats are not listed.
- [x] A trip nothing has been sold on returns an empty list, not an error.
- [x] A signed-out caller is refused at the gateway.
- [x] The generated ticketing client exposes it, with no other change to the client.

## Out of scope

- Restricting the trip ticket list and trip summary endpoints to staff: the owner's decision, a separate increment.
- Fixing `cancelTicket` returning 500 instead of 400 when sent no body.
- Anything in the passenger app.

## Constraints

- Additive only: no existing endpoint, response or table changes.
- Track 2 because it adds to a published contract; the owner reviews every line before merge.

## Decisions

- See ADR-030
