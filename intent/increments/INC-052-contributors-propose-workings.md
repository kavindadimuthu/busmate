---
id: INC-052
title: Contributors propose who usually works a departure, and stewards review it
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

An active contributor can propose who normally works a departure; a steward or staff member reviews it in the
same queue as stop proposals, and an approved one appears to passengers as "usually", labelled observed.

## Why now

Staff cannot know this for every departure; contributors can. INC-050 gave staff the screen, and the first pilot
data (INC-048) has departures with no working at all.

## Acceptance criteria

- [x] An active contributor proposes a working for a schedule; anyone else is refused.
- [x] A steward sees it only if its schedule's route group is one of theirs, never who proposed it.
- [x] The reviewer sees the proposal beside the workings the schedule already has.
- [x] Approval creates the working at `SRC_4`, dated to when it was seen; passengers see it as usually, observed.
- [x] A refusal from the working rules (overlap) reaches the reviewer and leaves the proposal pending.
- [x] Rejection reaches the contributor with its reason; withdrawing works.
- [x] Revert of a working proposal says it is not offered.
- [x] The daily cap counts all proposal types together.
- [x] A contributor can propose from a departure's page, and a steward can review it, in a browser test.

## Out of scope

- Correcting or ending a working by proposal.
- Choosing a registered operator or bus.
- Proposals for other record types (routes, schedule times).
- Reasons for rejecting a working are the three that fit (already recorded, can't verify, other).
- The generated client was extended by hand in the generator's form; regenerate it with the next contract change.

## Constraints

- One migration, R3: reviewed by a named human, run in production only by one.

## Open questions

- A contributor sees the departure's page, with its current "usually" line, before proposing; the form itself does not list them.

## Decisions
- See ADR-026
