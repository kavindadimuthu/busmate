---
id: INC-011
title: A passenger booking is priced and authorised by the server
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A passenger's online seat booking is priced, attributed and authorised entirely by
`ticketing-service`. The browser can ask to book a seat; it cannot decide what that seat costs, who
it belongs to, or whether the trip can be booked at all.

## Why now

Passenger self-booking is the half of the `F-1` metric that passenger-facing surfaces contribute to,
and [ADR-013](../decisions/ADR-013-passenger-fares-collect-centrally-settle-periodically.md) has
settled where the money lands. Before a real PSP is attached to this flow, the flow has to be safe
to attach one to: today the amount charged, the passenger charged, and the right to cancel all come
from the request body.

## Design

**Identity comes from the token, never the body.** `api-gateway` already verifies the JWT and
forwards `x-user-id`. The booking, cancellation and per-passenger read paths take the passenger
from that header and ignore any `passengerId` a client sends. Staff listing paths keep their
existing behaviour.

**The fare is recomputed server-side, from data the client never touches.** `ticketing-service`
already owns the fare tables but is handed `routeId`, the two stop distances and a bus type by the
caller. It will instead resolve them from `core-service` for the trip being booked — invariant 2
(cross-domain data over the API) — and price the journey itself. A client-supplied `fareAmount`
becomes advisory: if it disagrees with the computed fare, the computed fare wins.

**The fare tier is the unsolved part of pricing.** `base_fare` has five tiers, but `core-service`'s
bus record has no service class — only a `facilities` JSON blob. The passenger apps guess the tier
from air conditioning, and that guess does not even reach the fare table intact (see Discovered).
This increment resolves the tier in one place server-side; it reads a real service class recorded on the bus
rather than inferring one from equipment, because a fare is money and a guess about air
conditioning is not a fact about what a seat costs.

**Bookability is checked before a payment can ever be started**: the trip exists and is still
scheduled, a bus is assigned to it (without one there is no seat map to sell against), and the
booking cutoff before scheduled departure from the boarding stop has not passed.

**A booking covers up to five seats** as one payment and one ticket per seat. The schema already
allows several tickets against one transaction, so group booking costs little now and would cost a
rebuild of the booking API and every web screen later.

**Seat integrity is deliberately not in this increment** — see Out of scope.

## Acceptance criteria

- [ ] A booking request that asks to pay an arbitrary amount produces a ticket at the real computed
      fare, or is rejected — never a ticket priced at the requested amount.
- [ ] A booking request naming another passenger produces a ticket belonging to the logged-in
      passenger, not the named one.
- [ ] A passenger reading another passenger's tickets, or a single ticket that is not theirs, is
      refused.
- [ ] A passenger cancelling a ticket that is not theirs is refused.
- [ ] Booking is refused, with a reason a person can act on, for a trip that has already departed,
      has been cancelled, has no bus assigned, or is past the booking cutoff.
- [ ] A journey on an air-conditioned bus returns a real fare figure, not an error string reported
      as a successful response.
- [ ] A booking for several seats produces one ticket per seat against a single payment, and is
      refused above five.
- [ ] The acceptance criteria above are covered by tests naming INC-011, running against real
      Postgres through the existing Testcontainers base class.

## Out of scope

- **Seat integrity** — the trip+seat uniqueness rule, holds on unpaid seats, and expiry of abandoned
  bookings. Its own increment, because it needs a migration and a background sweep.
- **PayHere.** This increment leaves `DummyPaymentGateway` in place; it makes the flow safe to
  attach a real PSP to, and attaching one is the next increment.
- **Refunds** of money already captured.
- Per-operator revenue attribution and the periodic settlement process
  ([ADR-013](../decisions/ADR-013-passenger-fares-collect-centrally-settle-periodically.md)).
- The conductor-issue path (`/conductor/issue`), which has its own identity model.

## Constraints

- **R3, A2.** Fare money. Every line human-reviewed regardless of how mechanical it looks.
- `ticketing-service` calling `core-service` must not reach into its tables — API only
  (invariant 2), and `core-service` stays the owner of trip, route and fleet data.
- No change to the `ConductorLogTicketDTO` contract fields INC-009 and INC-010 introduced;
  a pre-booked online ticket must keep reporting as `PAYHERE`/`SETTLED` custody and
  `ONLINE`/`PRE_BOOKED` stage.

## Open questions

- None blocking.

## Decisions

- See [ADR-013](../decisions/ADR-013-passenger-fares-collect-centrally-settle-periodically.md).

## Discovered during the work

**Fare calculation silently fails for every air-conditioned bus.** The passenger apps send a bus
type of `SEMI_LUXURY`; `BaseFareServiceIMPL` lowercases it to `semi_luxury` and matches it against
`semiluxury`, falls through to its default branch, and returns the string `"Invalid type"` as a
successful `200` response. The caller parses that as a number, gets `NaN`, and shows no fare. Every
non-AC journey works, which is why this has not been noticed.
