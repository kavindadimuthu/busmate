---
id: INC-074
title: Passenger-web v2 — routes and route details
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger who knows a route but not where they're going to or from can browse every route BusMate has, open one
to see where it goes and its stops in order, and jump into looking for a bus on it.

## Why now

Routes are the one public part of the site v2 still didn't have: the landing page's route cards and the header both
link to them, and both led to "not rebuilt yet".

## Acceptance criteria

- [x] The routes page lists every published route with its number, road type, start and end, the towns it goes
      through, distance, usual journey time and number of stops, and how far to trust the route's data.
- [x] Routes can be searched by number, name, town or stop (matching the start of a word, so "gal" finds Galle and
      "galle" doesn't find Kegalle), narrowed by road type, and ordered by number or distance; the search, road type
      and order live in the address, so a reload or a shared link shows the same list.
- [x] A search with no match, a failed load and an empty list each say what happened and what to do.
- [x] A route's page shows its summary and trust label, its stops in running order with distance from the start
      (start and end marked, accessible stops flagged only where recorded), a note when the stop list is only
      partial, and the same route going the other way.
- [x] "Find a bus on this route" opens the bus search from the route's first stop to its last, for today.
- [x] An unknown or mistyped route, a failed route load and a failed stop load each say what happened; a failed
      stop load never hides the rest of the route.
- [x] Nothing shows what BusMate can't back: no map, no timetable or "related schedules", no fares, service hours,
      buses per day or ratings.
- [x] On a phone nothing scrolls sideways, every control is at least 40px, and the search box and first route (or
      the "find a bus" button) are on the first screen.

## Out of scope

- A route map: an opt-in "show map" is its own later increment.
- Schedules, service hours, fares and buses per day for a route: there is no public source for them. Searching for
  a bus answers what runs on a given day.
- Editing routes: staff and contributors do that elsewhere.

## Constraints

- Public pages, using only the routes and stops reads the gateway already leaves open.
- No new dependency. The search, filter and sort logic is pure and tested with Node's built-in runner.

## Decisions

- Left out of the design, as having no backing: "Most frequent" and "Lowest fare" ordering, buses per day, fares,
  service hours, related schedules, the map.
