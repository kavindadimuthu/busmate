---
id: INC-071
title: Passenger-web v2 — my tickets and ticket detail
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A signed-in passenger can see all their bookings, open any ticket to board with, and cancel a booking that isn't
complete, with wording that never claims more than BusMate knows.

## Why now

Booking ([INC-069](INC-069-passenger-web-v2-seat-selection.md), [INC-070](INC-070-passenger-web-v2-payment.md))
ends at "View my tickets", which led nowhere in v2. This closes the passenger journey.

## Acceptance criteria

- [x] My tickets lists the passenger's bookings grouped by trip, with the seats and status of each, upcoming
      first and past or cancelled after, each trip showing its route, date and departure time with its trust label.
- [x] A passenger with no tickets sees an empty state with a way to book, not an error.
- [x] A ticket's page shows the trip, seat, bus, passenger, fare and reference, and a boarding QR code for a
      confirmed or boarded ticket, in the same form the conductor's scanner already reads.
- [x] The QR stays black on white in dark mode, and the page prints without the site header and footer.
- [x] Nothing says a ticket was "paid": a confirmed booking may not have taken money while payments are off.
- [x] A booking that isn't complete can be cancelled after a confirmation, and its seat is released; a confirmed
      one says it can't be cancelled here and shows how to reach the operator.
- [x] A trip the operator cancelled says so on the list and on the ticket.
- [x] Someone else's ticket, a mistyped address, a failed lookup and a failed list each say what happened; a
      failed trip lookup never hides the ticket.
- [x] On a phone nothing scrolls sideways, every control is at least 40px, and the QR fits the screen.

## Out of scope

- Refunds and changing a confirmed ticket: BusMate doesn't handle them; the operator does.
- Sharing a ticket: only its owner can open it, so a link would mislead.
- Restoring an unfinished booking's payment step from a ticket: the server doesn't hold what that needs.
- Fixing the server answering 404 for "no tickets yet": handled in the page; a published-contract change.

## Constraints

- The QR payload keeps passenger-web's keys exactly, so v2 tickets scan in the conductor app.
- One new dependency, `qrcode.react`, the same package and version passenger-web ships.

## Decisions

Made with the owner on 2026-10-01:
- Adding `qrcode.react` to v2 is approved.
