---
id: INC-012
title: A booked, cancelled or expired seat means what it says
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Two passengers can never hold the same seat on the same trip at once, an abandoned unpaid booking
stops blocking that seat after a short wait, and a freed seat — by cancellation or by expiry —
actually shows as free everywhere a conductor looks.

## Why now

[INC-011](INC-011-server-priced-passenger-booking.md) made booking honest about price and identity
but left seat selection unguarded: nothing stops two passengers booking seat A1 on the same trip,
and a booking that is never paid for holds its seat forever. Real money
([ADR-013](../decisions/ADR-013-passenger-fares-collect-centrally-settle-periodically.md)) makes
both worth fixing before PayHere is wired in.

## Design

**A seat is held by exactly one live ticket, enforced by the database, not just application
logic.** A partial unique index on (`trip_id`, `seat_number`) where the ticket is not cancelled and
has a seat assigned means the database itself refuses a second concurrent booking for the same
seat — the application-level check below is for a clear error message, not the only guarantee.

**An unpaid online booking holds its seat for 10 minutes**, recorded as `hold_expires_at` on the
ticket. Freeing an expired hold always goes through the same `Tickets.status = CANCELLED` path a
genuine cancellation uses, so the seat-uniqueness index and every screen that already excludes
cancelled tickets handle it identically — no second state to keep in sync.

**Expiry is both lazy and swept.** A booking request first expires any stale holds on the seats it
wants, so a passenger is never blocked by someone else's abandoned checkout. A scheduled sweep also
runs independently, so a seat frees up even if nobody else tries to book it — and so conductor
screens stop showing a phantom passenger without anyone needing to retry a booking first.

**Paying late never un-frees a seat someone else took.** If a hold has already expired and the seat
reassigned by the time payment would complete, the booking stays cancelled; the payment attempt is
refused with a clear reason rather than silently reviving a ticket whose seat may already belong to
someone else.

**A multi-seat booking is all-or-nothing.** If any requested seat is unavailable, the whole request
is refused before anything is created — never a partial booking with one seat paid for and another
silently dropped.

## Acceptance criteria

- [ ] Two simultaneous requests for the same trip and seat: exactly one succeeds, the other is
      refused with a reason, and the database itself (not just a race in application code) is what
      decided which one wins.
- [ ] An unpaid booking older than 10 minutes no longer blocks that seat from being booked by
      someone else.
- [ ] A cancelled or expired booking shows as available — not booked, not validated — everywhere a
      conductor sees the seat map, including in the two real screens that build one independently.
- [ ] Confirming payment on a booking whose hold has already expired is refused, with a reason,
      never silently marked paid.
- [ ] A multi-seat booking where one seat is unavailable creates no tickets and no payment record.
- [ ] Tests named INC-012 cover all of the above against real Postgres, including a real concurrent
      request for the same seat.

## Out of scope

- PayHere itself ([INC-013]) — the dummy gateway is untouched.
- Waitlisting or notifying a passenger when a held seat frees up.
- Any change to the conductor-issue (cash/card) flow's own seat assignment.

## Constraints

- R3, A2 — fare money and a schema migration.
- The partial unique index, not application logic alone, is the actual guarantee against a double
  booking; application-level checks exist for a good error message, not as the source of truth.

## Open questions

- None blocking.

## Decisions

- None new; builds on [ADR-013](../decisions/ADR-013-passenger-fares-collect-centrally-settle-periodically.md).

## Discovered during the work

**A cancelled online booking never actually freed its seat on the conductor's live view.**
`getTicketDetailsByTripId` returns every ticket for a trip including cancelled ones, and both real
seat-map builders that consume it — `useSeatMap.ts` (the live Journey seat map) and
`ticketApi.getSeatBookings` (used by four screens: trip details, trip overview, PassengerList,
BusLayout) — took whichever ticket happened to occupy a seat number in the response, never checking
whether it was cancelled. A passenger cancelling their booking (already possible after INC-011)
left that seat showing as permanently booked to every conductor for that trip. Fixed in both
builders by excluding cancelled tickets, which is also what makes a freed seat (by cancellation or
by this increment's expiry) actually show as available rather than merely being free in the
database.
