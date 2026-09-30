# ADR-030 · A passenger's seat map learns which seats are taken, and nothing more

**Date:** 2026-09-30 · **Status:** Proposed
**Type:** architecture

## Context

To draw a seat map, a passenger needs to know which seats on a trip are taken. Today the only way to learn that
is `GET /api/v1/tickets/trip/{tripId}`, which returns every ticket on the trip, and any signed-in user may call
it; `GET /api/v1/tickets/trip/{tripId}/summary` similarly returns the trip's takings. Both were built for
conductors and operators, but the gateway only checks that the caller is signed in. A passenger app that uses
them (as `passenger-web` does) is reading other passengers' ticket rows to colour a grid.

## Options considered

1. **Keep using the trip ticket list from the passenger app.** No backend change, but v2 would be built on the
   leak and depend on it.
2. **Lock the existing endpoints to staff now.** Right in the end, but it would break `passenger-web` and the
   conductor app until each is moved, and those are other owners' running apps.
3. **Add a narrow endpoint that returns only seat labels, and move v2 to it.** *(chosen)* Additive, breaks
   nothing, and gives the passenger app everything it needs and nothing else.

## Decision

Add `GET /api/v1/tickets/trip/{tripId}/occupied-seats` returning `{tripId, occupiedSeats: [label…]}`: the
distinct seat labels of every non-cancelled ticket on the trip, sorted. It is the same rule booking already
uses to refuse a seat, so a seat listed here is exactly a seat booking would refuse. No ticket ids, people,
fares or payment state. Any signed-in user may call it; a trip with nothing sold returns an empty list.

The two leaky endpoints are left as they are. Whether to restrict them to staff, and when, is the owner's call
and a separate increment, because it changes what two running apps can do.

## Consequences

- v2's seat map does not touch the leaky endpoints.
- The leak remains for `passenger-web` and anything else calling them until they are restricted.
- The endpoint says a seat is unavailable, not why; an unpaid hold counts until it is freed, as it does for booking.
