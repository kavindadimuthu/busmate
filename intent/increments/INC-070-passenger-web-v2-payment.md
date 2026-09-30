---
id: INC-070
title: Passenger-web v2 — pay, confirmation and PayHere return
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger who has reserved seats can see what they cost, complete the booking, and see it confirmed, whether
payments are switched on (PayHere) or not (today), with wording that never claims more than is true.

## Why now

Reserving seats ([INC-069](INC-069-passenger-web-v2-seat-selection.md)) holds them only briefly and ends at
"not rebuilt yet". This closes the booking journey in v2.

## Acceptance criteria

- [x] The payment step shows the fare the server charged: per seat and in total, with the trip and seats.
- [x] While payments are off, the page says plainly that no money will be taken, and its button says
      "Confirm booking", not "Pay". The success page says no money was taken.
- [x] When the server returns a PayHere checkout, the page shows the total on a button that sends the passenger
      to PayHere; nothing is sent automatically, and only an http(s) address is ever used.
- [x] Confirming settles every seat of the booking, and the success page shows the trip, seats, total and ticket
      numbers, then clears the booking when the passenger leaves.
- [x] Coming back from PayHere with `order_id=TICKET-<id>` waits for the payment to settle and reports paid,
      failed, or still waiting after about 30 seconds (never "failed" just for being slow), and works after a
      full page load. Cancelling at PayHere says the passenger wasn't charged.
- [x] A held seat that expired, a payment that didn't go through, an ended session and no connection each say
      what happened and what to do.
- [x] A refresh on the payment step keeps the reservation.
- [x] On a phone the confirm button is fixed to the bottom edge, nothing scrolls sideways, and every control is
      at least 40px.

## Out of scope

- Turning PayHere on, and any change to what the server charges: the payment gateway is the owner's decision.
- "My tickets" and ticket details: their own increment; links to them show "not rebuilt yet" until then.
- Saved payment methods, and a choose-a-payment-method step: nothing in BusMate backs them.

## Constraints

- The server's response decides how a booking is paid; nothing here is changed by switching PayHere on.
- The return and cancel addresses are the ones the server already gives PayHere, unchanged.
- No new third-party dependency. Pure logic is tested with Node's built-in runner.

## Decisions

Made with the owner on 2026-09-30:
- Honest payment wording while the dummy gateway is active.
- The PayHere logic is reused as it is; only the pages are restyled.
