---
id: INC-052
title: Contributors propose who usually works a departure, and stewards review it
state: active
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

- [ ] An active contributor proposes a working for a schedule; anyone else is refused.
- [ ] A steward sees it only if its schedule's route group is one of theirs, never who proposed it.
- [ ] The reviewer sees the proposal beside the workings the schedule already has.
- [ ] Approval creates the working at `SRC_4`, dated to when it was seen; passengers see it as usually, observed.
- [ ] A refusal from the working rules (overlap) reaches the reviewer and leaves the proposal pending.
- [ ] Rejection reaches the contributor with its reason; withdrawing works.
- [ ] Revert of a working proposal says it is not offered.
- [ ] The daily cap counts all proposal types together.
- [ ] A contributor can propose from a departure's page, and a steward can review it, in a browser test.

## Out of scope

- Correcting or ending a working by proposal.
- Choosing a registered operator or bus.
- Proposals for other record types (routes, schedule times).

## Constraints

- One migration, R3: reviewed by a named human, run in production only by one.

## Open questions

- Should a contributor see workings already on a departure before proposing? Assumed yes.

## Decisions
- See ADR-026
