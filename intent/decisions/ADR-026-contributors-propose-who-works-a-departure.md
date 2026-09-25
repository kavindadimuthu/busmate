# ADR-026 · Contributors can propose who usually works a departure; it goes through the same review as a stop

**Date:** 2026-09-25 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-024](ADR-024-a-departures-normal-working-is-its-own-record.md) made "who usually works this departure"
a record of its own, and staff can write it. Staff will not hold it: the people who know it are the ones who
ride and work the routes. [ADR-018](ADR-018-community-changes-are-reviewed-changesets.md) built one review
path for community changes and wired only stops into it; [ADR-022](ADR-022-a-changesets-corridor-is-derived-and-stewards-review-blind.md)
made that path corridor-scoped and blind to the proposer.

## Options considered

1. **A second, workings-only review path.** Simple to write, and two queues to staff, two sets of authority
   rules to keep in step, and stewards learning two screens.
2. **Contributors write workings directly, reviewed afterwards.** Fast, and puts unreviewed data in front of
   passengers, which ADR-018 rules out.
3. **Extend the changeset to a second record type.** *(chosen)*

## Decision

- **A new changeset type, `SCHEDULE_WORKING`, create only.** A contributor proposes a *new* working for a
  schedule: an operator name and/or plates as seen, a service class, when they saw it and how they know.
  Correcting or ending an existing working stays with staff, who have the portal for it (INC-050): a contributor
  who thinks one is wrong proposes the new truth and staff or a steward reconcile.
- **The changeset's target is the schedule** (the parent), since the working does not exist yet.
- **Names and plates only.** A contributor cannot pick a registered operator or bus: they see a name on a
  bus, not a registry. Linking to the registry remains a staff act afterwards (ADR-024).
- **Scope is derived, as for stops.** A working proposal belongs to the route group of its schedule's route,
  so a steward reviews it exactly where they review stops. A proposal with no corridor is staff-only.
- **Approval writes the working** through the same code staff use, at `SRC_4` (observed by an accepted
  contributor), dated to when the contributor saw it, credited generically. Any refusal that code makes — a
  same-operator overlap, an unrecognisable vehicle — reaches the reviewer as the reason, and the proposal is
  rejected rather than forced.
- **Revert is not offered.** It is staff-only for stops because it restores a previous state; a rejected
  working has no previous state, and staff delete a mistaken one directly. Saying so is better than a revert
  that half-works.
- **One queue.** The review queue shows every type, filterable by type; the daily proposal cap counts all types
  together, as its configuration always said.

## Consequences

- **Nothing becomes trusted faster.** Approval is by a human who cannot see the proposer; the tier is the same
  `SRC_4` a stop gets. A working still never generates or alters a trip.
- **One migration** widens the changeset's type check. A production migration is a human step.
- **The record type must be checked wherever a reviewer acts.** Approve, reject and read each handled stops
  only; each now branches on type, and a new type added later must be handled in all of them.

## Revisit when

- Contributors ask to correct or end a working themselves, at which point `UPDATE` needs a design of its own.
- A third record type arrives: branching on type in the review service should become a small handler per type.
