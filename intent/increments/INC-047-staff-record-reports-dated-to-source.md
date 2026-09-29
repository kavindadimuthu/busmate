---
id: INC-047
title: Staff can record something as a report, dated to when it was made
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A staff member transcribing a third party's timetable can record it as a report — not as BusMate's own
observation — and dated to when the third party made it, so passengers see "reported, 13 Oct 2025" instead of
"observed, confirmed today".

## Why now

[ADR-025](../decisions/ADR-025-staff-may-record-a-report-dated-to-its-source.md). The import of the Embilipitiya
post (INC-048) would otherwise overclaim to every passenger who looked at it.

## Acceptance criteria

- [x] Staff can create a stop, route, schedule and working as `SRC_5`, and it reads as reported.
- [x] A create or edit can state the date the information dates from; it appears as the record's observed date.
- [x] A date in the future is refused; `SRC_6` is still refused; `SRC_1` is still MOT only.
- [x] Leaving both out changes nothing: a record is `SRC_4` and observed now.
- [x] Editing a `SRC_5` record without stating a date leaves its observed date alone.
- [ ] Passenger-web shows such a record as reported, with the date it dates from.
- [x] Tests named INC-047 cover each, against real Postgres.

## Out of scope

- A source link on a record, an explicit "verified on" action, and the import itself (INC-048).

## Constraints

- Touches the provenance rules of ADR-018: R3, named reviewer. No schema change.
- Adds an optional field to published requests, so the core-service client is regenerated.

## Decisions

- See ADR-025
