---
id: INC-048
title: The Embilipitiya community timetable post is loaded as reports, and passengers can open every departure
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

The six Embilipitiya ↔ Colombo lists of a community-compiled Facebook timetable (routes 03 and 122, both
directions) are in BusMate as reports dated to the post, each with who usually works it, and a passenger can
search them and open each one.

## Why now

The path chosen for the community-data programme is to load real data through staff before building contributor
proposals: a 100-departure post is the best test the model of ADR-023 and ADR-024 will get.

## Acceptance criteria

- [x] A script reads the post into a CSV a person can check before anything is loaded, and reports every section
      and line it did not read, so coverage is a number.
- [x] Loading records every stop, route, schedule and working as a report (`SRC_5`) dated to the post, credited to
      it; times only in the unverified columns; every schedule `ORIGIN_ONLY`; every route `PARTIAL`.
- [x] Nothing is guessed: no coordinates, no service class the post does not state, and a calendar only where it
      states days ("except Sunday"). Where it says nothing, none is recorded and the description says so.
- [x] Booking phone numbers are never captured.
- [x] It can be run twice, keeps to the gateway's rate limit, and finishes a run that stopped part-way.
- [x] Search finds the departures, each showing who usually runs it, labelled reported and dated to the post.
- [x] A departure known only at its origin can be opened: details no longer fail with "Invalid stop sequence".
- [x] The schedule description, where the "days not stated" note lives, reaches the passenger.
- [x] Tests: the parser (invented data only) and the origin-only details, against real Postgres.

## Out of scope

- The expressway lists, the route-69 and other long-distance lists, fares, and booking contacts: 12 departure lines
  in the copy that was loaded sit in sections this importer does not read, and the real post has more. Through-running
  and short-working notes are kept as text, not modelled (ADR-024).
- Stop positions. The four stops have none; a steward can add them through the existing stop-correction flow.
- A portal importer. This is a script; a portal screen would read the same CSV.

## Constraints

- The post is someone else's work and carries operators' phone numbers: it lives outside the repository. Only the
  parser and an invented sample are committed.
- English stop and route names are transliterations chosen by the importer, not the post's.
- Every departure the post gives no operating days for is shown on every day, because search does not restrict a
  schedule with no calendar. That is a display behaviour, not a claim, and the description says days were not stated.

## Decisions

- See ADR-024 and ADR-025
