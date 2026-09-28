---
id: INC-061
title: Staff correct an AI's reading of a post and load it as reports
state: shaped
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

From a reviewed draft (INC-060), staff fix what the AI got wrong, match each place to a stop, and load the
result into BusMate under exactly the rules the timetable script already follows.

## Why now

INC-060 shows the reading; this is the half that turns a checked reading into data.

## Acceptance criteria

- [ ] Staff can edit any cell, add a row the AI missed, and delete a row it invented.
- [ ] Each place name is matched to an existing stop by code; staff confirm the match or choose to create a
      new stop. The AI never picks a stop.
- [ ] Staff set the source label and the date the post dates from; the post's own date, if found, is offered.
- [ ] Approving loads stops, routes, schedules and workings as reports dated to the post, times unverified,
      no positions, days only where stated, no fares — the same rules as `scripts/timetable-post/import.mjs`.
- [ ] Applying the same draft twice changes nothing.
- [ ] A row flagged as not found in the post, or a line left unaccounted for, needs an explicit decision
      before the draft can be approved.
- [ ] The draft keeps what staff loaded beside what the AI proposed.
- [ ] The result is reported row by row: created, already there, or failed with a reason.
- [ ] Tests: loading and re-loading against real Postgres; a browser test of edit, match and approve.

## Out of scope

- Removing phone numbers before sending (see ADR-028).
- Images and screenshots; contributors.

## Constraints

- Named reviewer: kavinda.

## Decisions
- See ADR-028
