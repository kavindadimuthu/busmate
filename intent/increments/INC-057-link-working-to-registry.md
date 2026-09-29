---
id: INC-057
title: Staff link an observed operator or plate to the real registry
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A name or plate someone only saw, on a schedule's usual workings, can be linked to a registered operator or
bus from the schedule page — the API for this has existed since INC-045 and had no screen.

## Why now

The next piece of the community-workings feature (a contributor correcting a working) is more useful once
staff have a normal way to resolve what contributors and staff have already recorded. Small and self-contained
on its own, so it goes first.

## Acceptance criteria

- [x] An unresolved operator name shows a Link control; choosing a registered operator links it and the
      observed name is kept, not overwritten.
- [x] An unresolved plate shows the same, filtered to the linked operator's own fleet once there is one.
- [x] The server's own rule — a bus registered to a different operator — reaches the screen as the reason,
      not a raw failure.
- [x] A browser test proves linking end to end, and proves the mismatch is refused.

## Out of scope

- Contributors correcting or ending a working themselves (ADR-026 named this as needing a design of its
  own; it is the next increment).
- Un-linking something linked by mistake.

## Decisions

- No backend change: `resolveScheduleWorkingOperator` and `resolveScheduleWorkingBus` already existed and
  already had every rule this needed.
