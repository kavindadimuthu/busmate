---
id: INC-073
title: Fare quote before booking
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A passenger can see what seats will cost before they reserve them, and the figure is the one booking then charges.

## Why now

Until now the first price a passenger saw was the reservation's, after they had picked seats and committed to a
booking. A price-before-booking was set aside until it could come from the server rather than be worked out in an
app ([ADR-032](../decisions/ADR-032-a-fare-shown-before-booking-is-a-server-quote-from-the-pricing-booking-uses.md)),
and real payments can't go live without it.

## Acceptance criteria

- [x] `GET /api/v1/tickets/quote` returns the per-seat fare and the total for a number of seats on a journey,
      in rupees, priced by the same code as a booking.
- [x] A quote for one or several seats equals what a real booking then charges for them.
- [x] Asking for a quote holds nothing and creates nothing, and needs no login through the gateway; every other
      ticket route still needs a token.
- [x] No seats, more than the booking limit, and a journey that can't be priced are each refused with a reason.
- [x] The generated ticketing client exposes it, with no other change to the client.
- [x] In v2 the trip page shows the fare per seat (signed in or not), the seat page shows the total for the seats
      chosen as they change, and the review page shows the total; the payment page still shows the charged figure.
- [x] If the quote can't be had, v2 says the fare comes when seats are reserved and nothing else changes.
- [x] On a phone the new figures fit at 320px, and the journey card no longer wraps its times or clips its stops.

## Out of scope

- A price on search results: the search has no trip to price.
- Any change to how fares are calculated, or to what booking charges.
- Restricting or rate-limiting the quote beyond the gateway's general limit.

## Constraints

- Additive to the ticket contract: one endpoint, one response type; the client is regenerated.
- The owner reviews every line before merge (Track 2, R3).

## Decisions

- See ADR-032
