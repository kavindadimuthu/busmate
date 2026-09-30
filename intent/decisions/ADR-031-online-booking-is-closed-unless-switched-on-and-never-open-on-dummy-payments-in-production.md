# ADR-031 · Online booking is closed unless switched on, and production never opens it on dummy payments

**Date:** 2026-10-01 · **Status:** Proposed
**Type:** architecture

## Context

A passenger's online booking is paid through a gateway chosen by `payhere.checkout.enabled`
([ADR-014](ADR-014-payhere-hosted-checkout-for-passenger-booking.md)). While that is off, the dummy gateway is
active: it confirms every booking without taking any money. That is right for development, but on `busmate.site`
it would hand out real seats for nothing, to anyone who can call the booking endpoint. PayHere itself can't be
turned on until a registered HTTPS domain exists.

Hiding the "Choose seats" button in an app doesn't help: the endpoint is public to any signed-in user, and the
existing apps (passenger-web, passenger-mobile) call it directly.

## Options considered

1. **Hide the button in the apps.** Cheap, but the endpoint stays open, and each app has to remember.
2. **Refuse to deploy until PayHere is on.** Blocks every other production change on one dependency.
3. **A server-side switch, closed by default, with a startup guard for production.** *(chosen)* Enforced where it
   can't be bypassed; a forgotten setting fails safe.

## Decision

`booking.online-enabled` (env `TICKETING_ONLINE_BOOKING_ENABLED`) decides whether `POST /api/v1/tickets/book`
works. It defaults to **closed**; the dev profile opens it; tests open it.

When closed, booking answers **503** with code `BOOKING_CLOSED` before it reads anything or holds a seat. Existing
holds can still be confirmed or cancelled, and conductor sales are unaffected.

`GET /api/v1/tickets/booking-status` returns `{onlineBookingOpen}`, public through the gateway (one yes/no fact),
so an app can say so before a passenger picks seats.

In the `prod` profile, ticketing-service **refuses to start** if booking is switched on while real payments are
off. Opening booking in production therefore needs real payments first: this is checked, not remembered.

## Consequences

- Nothing is bookable on production until PayHere is on and `TICKETING_ONLINE_BOOKING_ENABLED=true` is set.
- Any client, old or new, gets the same refusal with a plain message; passenger-web and passenger-mobile show
  the server's message already.
- Demoing booking on production isn't possible with dummy payments, by design.
- Passenger-web v2 reads the status and shows "Online booking isn't open yet" instead of "Choose seats".
