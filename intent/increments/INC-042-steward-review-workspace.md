---
id: INC-042
title: A steward reviews proposals in their corridors from passenger-web
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A steward signs in to passenger-web, sees the proposals waiting in their corridors, compares each with the
current stop, and approves or rejects it — without staff access and without seeing who proposed it.

## Why now

[INC-041](INC-041-stewards-review-their-corridor.md) gave stewards the authority and the API. They are
ordinary passengers, and the staff portal admits staff only, so today they have nowhere to use it
([ADR-019](../decisions/ADR-019-contributor-standing-lives-with-the-network.md) put their workspace here).

## Acceptance criteria

- [ ] A steward sees a queue of pending proposals in their corridors, and can switch to decided ones.
- [ ] Opening a proposal shows what would change against the current stop, both positions on a map, how
      and when it was observed, and the proposer's declared affiliation and record — never their identity.
- [x] A steward can approve or reject (with a reason from the list); approving is disabled, with the
      reason, when the stop has changed since or already outranks community data.
- [x] A passenger who is not an active steward is told so, and is offered the way to become a contributor.
- [x] A steward finds the workspace from *My contributions*; nobody else sees the link.
- [x] No revert control appears anywhere; that stays with staff.

## Out of scope

- Proposal types other than stops, notifications, and any change to the API or its authority rules.

## Constraints

- Every decision is enforced by core-service ([ADR-022](../decisions/ADR-022-a-changesets-corridor-is-derived-and-stewards-review-blind.md));
  this UI only hides what the server would refuse anyway, so hiding is a courtesy, never the control.
- Must not call user-service for the proposer's name: the server withholds it from stewards by design.

## Decisions

- See ADR-022
