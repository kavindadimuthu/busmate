---
id: INC-066
title: Passenger-web v2 — Find My Bus results
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger who searches from the landing page (or edits the search) sees the buses that run between their two
stops on their date, can narrow and sort them, and can tell how far to trust each time, all comfortably on a
phone.

## Why now

The landing page's search bar hands off to this page and currently lands on "not rebuilt yet". It is the core
passenger flow, and the route and trip detail screens hang off its results
([INC-063](INC-063-passenger-web-v2-roadmap.md) phase 2 order).

## Acceptance criteria

- [x] Searching from the landing page shows that day's buses between the two stops, each with route, departure
      and arrival, how long it takes, distance, and a trust label for its times that a tap explains.
- [x] A search where the passenger typed stop names without picking from the list still works when the name
      is unambiguous, and otherwise asks which stop they meant instead of failing.
- [x] The passenger can change the stops and date, and step to the previous or next day, without leaving the page.
- [x] Results can be sorted (earliest, fastest, shortest) and narrowed by time of day, road type and route, all
      instantly, and the page says how many are hidden and how to clear it.
- [x] Buses whose scheduled time has already passed today are kept out of the way of the ones still to come,
      and a cancelled bus is shown but never ahead of one that is running.
- [x] No buses, no direct route, a network failure and a broken link each say what happened and what to do.
- [x] On a 360px phone the search summary and first result are on the first screen, nothing scrolls sideways,
      and every control is at least 40px tall.
- [x] Nothing shows what the search can't tell us: no prices, ratings, seats left, amenities or "live"
      claims; a bus's own status is worded as what it is.
- [x] Details links carry the same query the current app's cards send, so the trip details screen can read them.

## Out of scope

- The trip details screen and booking: the Details link lands on "not rebuilt yet" until its increment.
- Fares. The search result carries no price; ticketing has a separate fare calculation, which is a later
  question of whether and how to show a price here.
- The current app's "time data quality" choices: they never reached the API and changed nothing.
- Connections through a change of bus: the search finds direct buses only.

## Constraints

- One request per search (stops and date); sorting and filtering happen in the browser.
- No new third-party dependency. Pure logic is tested with Node's built-in test runner.
- Every time shown to a passenger carries its trust label, per `intent/context.md`.

## Decisions

Recorded here because the current app or the design differs:
- Filters kept are the ones that work on real data. The design's price, bus type, amenities and operator-rating
  filters, and the current app's time-quality choices, are left out.
- A bus in service is worded "In service", not "Live": there are no live positions yet
  ([context.md](../context.md) known debt).
- "Departed" is judged from the scheduled time in Sri Lanka time, and worded as a schedule fact, since the API
  only knows a bus has left when it has trip data.
- The server's `statusMessage` ("Scheduled service (verified times)") is not shown: it says "verified" of times
  whose trust label is only "Observed", and the current app never shows it either.
- "Today" means today in Sri Lanka, not on the phone.
- Typed names are resolved only when certain (one candidate, an exact name, or the only name or town that starts
  with the text); otherwise the passenger chooses.
