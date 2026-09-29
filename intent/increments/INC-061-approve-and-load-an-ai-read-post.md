---
id: INC-061
title: Staff correct an AI's reading of a post and load it as reports
state: active
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

- [x] Staff can edit any cell and choose not to load a row the AI invented (Load/Skip per row). Adding a row
      the AI missed entirely is not built — staff can still cover it by re-pasting a tighter excerpt.
- [x] Each place name is matched to an existing stop by code; staff confirm the match or choose to create a
      new stop. The AI never picks a stop.
- [x] Staff set the source label and the date the post dates from; the post's own date, if found, is offered.
- [x] Approving loads stops, routes, schedules and workings as reports dated to the post, times unverified,
      no positions, no fares — the same rules as `scripts/timetable-post/import.mjs`. Where the post states
      days, that text is kept as a description note rather than built into a calendar — the AI's days field
      is free text, and turning it into calendar exceptions without a real parser risks asserting a pattern
      the post never precisely stated.
- [x] Applying the same draft twice changes nothing (proven: reapproving reports every row already there).
- [x] A row flagged as not found in the post, or a line left unaccounted for, needs an explicit decision
      before the draft can be approved (an override reason, or an acknowledgement).
- [x] The draft keeps what staff loaded beside what the AI proposed.
- [x] The result is reported row by row: created, already there, skipped, or failed with a reason.
- [x] Tests: loading and re-loading against real Postgres (6 integration tests); a browser test of review,
      match and approve against a real draft.

## Out of scope

- Removing phone numbers before sending (see ADR-028).
- Images and screenshots; contributors.

## Constraints

- Named reviewer: kavinda.

## Decisions
- See ADR-028
