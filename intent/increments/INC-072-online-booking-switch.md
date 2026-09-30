---
id: INC-072
title: Online booking switch
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Online booking can't hand out seats for free: it is closed unless deliberately switched on, and production can't
be started with it open while payments are the dummy gateway.

## Why now

Production (`busmate.site`) can't take real payments until PayHere has a registered domain, and the dummy gateway
confirms every booking without taking money
([ADR-031](../decisions/ADR-031-online-booking-is-closed-unless-switched-on-and-never-open-on-dummy-payments-in-production.md)).

## Acceptance criteria

- [x] With booking closed, a booking request is refused with 503 and code `BOOKING_CLOSED`, before anything is
      read or held.
- [x] Booking is closed unless switched on; development and the tests switch it on.
- [x] In production, ticketing-service refuses to start with booking on and payments on the dummy gateway.
- [x] Anyone, signed in or not, can ask whether online booking is open, through the gateway, and every other
      ticket route still needs a token.
- [x] While closed, passenger-web v2's trip page and seat page say "Online booking isn't open yet" and offer no
      way to reserve, without promising when it will open; the rest of the trip page still works.
- [x] If booking is closed while a passenger is mid-way, the server's own reason is shown.
- [x] If the status can't be fetched, v2 behaves as before and leaves the decision to the server.

## Out of scope

- Changing passenger-web or passenger-mobile: they get the server's refusal and show its message already.
- Turning PayHere on, or setting the production variable: the owner's decision, and `docker-compose.production.yml`
  is on the always-human list, so it is not touched here.
- Conductor-issued tickets and confirming or cancelling holds made before the switch was closed.

## Constraints

- Additive to the ticket contract: one new endpoint, one new error code; the client is regenerated.
- The owner reviews every line before merge (Track 2, R3).

## Decisions

- See ADR-031
