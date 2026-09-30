---
id: INC-069
title: Passenger-web v2 — choose seats and reserve
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A signed-in passenger can choose up to five seats on the bus's real seat plan, see which are taken, review the
trip, and reserve the seats, comfortably on a phone.

## Why now

Trip details ([INC-067](INC-067-passenger-web-v2-trip-details.md)) now leads to "Choose seats", and the
occupied-seats endpoint ([INC-068](INC-068-occupied-seats-endpoint.md)) means the seat plan no longer needs the
leaky trip-ticket list. Payment is the next increment, so this one ends at reserving.

## Acceptance criteria

- [x] A signed-out visitor who taps "Choose seats" is sent to log in and lands on the same seat page afterwards.
- [x] The seat page shows the trip (route, day, departure time with its trust label, bus) and the bus's seat
      plan, with taken seats shown as taken and impossible to choose.
- [x] Up to five seats can be chosen and un-chosen; a sixth is refused with a reason. A chosen seat shows a
      tick, not only a colour.
- [x] A seat someone else takes while the passenger is looking is dropped from their choice, with a message.
- [x] Review shows the trip and the chosen seats, states that the fare is worked out when the seats are reserved
      and shown before paying, and has no passenger form and no price.
- [x] Reserving books the seats for real; a refusal (such as a seat just taken) shows the server's reason and a
      way back to choose again; an ended session sends the passenger to log in and back.
- [x] "Change seats" keeps the choice; a refresh on the review step keeps the booking.
- [x] A broken link, a bus with no seat plan and a network failure each say what happened and what to do.
- [x] On a phone the first seats and Continue are on the first screen, nothing scrolls sideways, and every seat
      and button is at least 40px.

## Out of scope

- Payment and confirmation (INC-070, to be shaped): "Reserve seats" leads to "not rebuilt yet" until it lands.
- Per-seat passenger names and ages, ladies-only seats and seat classes: BusMate books a seat, not a named person.
- Any price before the seats are reserved: needs a server-priced quote, its own reviewed increment.

## Constraints

- Availability comes from the occupied-seats endpoint only; nothing reads other passengers' tickets.
- The server decides what is bookable and what it costs; the page never trusts its own seat map.
- No new third-party dependency. Pure logic is tested with Node's built-in runner.

## Decisions

Made with the owner on 2026-09-30:
- No per-seat passenger details or price breakdown (no backing in BusMate).
- Payment wording stays honest while the dummy gateway is active (see the payment increment).
