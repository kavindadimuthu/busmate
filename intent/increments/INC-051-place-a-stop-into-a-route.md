---
id: INC-051
title: Staff add a stop to a partly-known route without breaking its schedules
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A route known only by its ends can be filled in one stop at a time from the route page, and a stop placed by
mistake can be taken out, without any schedule time on that route being lost or detached.

## Why now

INC-044 lets a route exist with only its ends, and INC-048 loaded routes like that with schedule times attached
at the origin. The only existing way to add a stop was to send the route's whole stop list, which deletes and
recreates every route stop and so breaks those times.

## Acceptance criteria

- [x] A stop is placed after a named stop; later stops move down one and no existing stop row is recreated.
- [x] It works on a route a schedule already has times on, and those times stay attached.
- [x] Refused, with a plain reason: a stop already on the route, a place after the route's end, no place named.
- [x] A placed stop can be removed and the rest close up; a route's end, or a stop a schedule has a time at, cannot.
- [x] A distance given with a stop is stored as unverified, never as a checked distance.
- [x] Staff only, enforced at the server.
- [x] The route page's Stops tab has "Add a stop" and a remove control; a browser test proves both.

## Out of scope

- Reordering stops, or moving a stop's place.
- Contributors proposing stops for a route (a changeset type).
- Marking the list complete as part of adding.
- The generated client was extended by hand in the generator's form; regenerate it with the next contract change.

## Open questions

- The stop picker loads every stop; at network scale it needs search.
