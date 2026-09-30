# ADR-032 · A fare shown before booking is a server quote from the same pricing booking uses

**Date:** 2026-10-01 · **Status:** Proposed
**Type:** architecture

## Context

A passenger can't see what a seat costs until they reserve it: the search has no price, and the booking response is
the first place a fare appears. Showing a price earlier is the obvious improvement, and the wrong ways to do it are
tempting: copying the fare tables into an app, or working the price out in the browser. Either would put a second
copy of money logic where it can't be trusted, and drift from what booking really charges
([INC-011](../increments/INC-011-passenger-booking.md) moved every fact behind the price to the server for this reason).

## Options considered

1. **Work the price out in the app** from fare tables it fetches. Two copies of pricing; they will disagree.
2. **Put a price on every search result.** Needs a fare per result per stop pair on every search: heavy, and the
   search has no notion of which trip a passenger will pick.
3. **A read-only quote endpoint that calls the same pricing code as booking.** *(chosen)* One implementation of
   the price; a quote can't drift from a booking.

## Decision

`GET /api/v1/tickets/quote?tripId&fromStopId&toStopId&seats` returns `{tripId, seatCount, farePerSeat, totalFare,
currency}`. It reads the same facts from core-service and prices them with the same `priceOf` and total formula as
`bookTicket`, so the two share code, not just numbers. It reserves and writes nothing.

It is **public** through the gateway: the trip page is public and a fare isn't private. It refuses a seat count
under one or over the booking limit, and an unpriceable journey, with the same messages booking gives.

A quote is a quote, not a promise: the reservation prices again, and what it returns is what is charged. Apps say
"confirmed when you reserve" and still show the reservation's figure before payment.

## Consequences

- Trip, seat and review pages can show a price, and the price is the one booking then charges (tested).
- The quote asks core-service each time; the gateway's general rate limit is the guard against abuse.
- It doesn't check the trip is still bookable: a page asks only for a trip it has already decided is open.
- Search results still show no price.
