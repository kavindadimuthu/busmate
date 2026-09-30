---
id: INC-067
title: Passenger-web v2 — trip details
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger who opens a bus from the results can see the whole departure — where it stops and when, whether it
runs on their date, who runs it and what bus — trust the times they're shown, and reach seat selection when a
bus is assigned, all comfortably on a phone.

## Why now

Every result's Details button lands here, and booking starts from here
([INC-063](INC-063-passenger-web-v2-roadmap.md) phase 2 order). Booking is split into later increments; this one
stops at the door of seat selection.

## Acceptance criteria

- [x] Opening a result's Details shows the route, the date, departure and arrival with their trust labels, how
      long it takes and how far, and the passenger's stops in a timeline, with the rest of the route one tap away.
- [x] It says whether the departure runs on the chosen date in the timetable's own terms (runs, doesn't, or the
      days were never stated), with the operating days, effective period and any exceptions.
- [x] It shows where the timetable came from and anything it doesn't say.
- [x] When a bus is assigned it shows the bus, its operator and how to reach them, and who usually runs it.
- [x] "Choose seats" appears only when a bus is assigned and the trip can still be booked; otherwise the page
      says why online booking isn't open, in plain words.
- [x] Other buses between the same two stops that day are listed, each opening its own details.
- [x] A signed-in passenger can report a problem with the departure; a signed-out one is sent to log in and back.
- [x] The passenger can share the departure (the phone's share sheet, or a copied link).
- [x] A broken link, an unknown departure and a network failure each say what happened and what to do.
- [x] On a 360px phone the journey and the booking state are on the first screen, nothing scrolls sideways, and
      every control is at least 40px tall.
- [x] Nothing shows what BusMate can't tell: no fare, seats left, ratings, policies, "track this bus", saved
      trips, or amenities beyond what the bus record actually states.

## Out of scope

- Seat selection, review, payment and confirmation: their own increments. "Choose seats" leads to "not rebuilt
  yet" until then.
- The route map: an opt-in "show map" is its own later increment (Google's script and key, and heavy on data).
- Fares and any price before booking: needs a server-priced quote, its own reviewed increment before real
  payments go live.
- Contribute pages the "tell us" links point to: they land on "not rebuilt yet" until rebuilt.

## Constraints

- One details request per departure; the other-departures list reuses the results search's own request.
- No new third-party dependency. Pure logic is tested with Node's built-in runner.
- Every time shown carries its trust label, per `intent/context.md`.

## Decisions

Made with the owner on 2026-09-30:
- Map: timeline now, map later as opt-in.
- Price: not shown before booking; a quote endpoint comes as its own increment before PayHere is switched on.
- The design's fare box, seats left, operator rating, policies and "track this bus" have no backing and are left
  out; "amenities" shows only what the bus record states (air conditioning, accessibility).
