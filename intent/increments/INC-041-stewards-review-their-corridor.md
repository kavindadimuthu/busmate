---
id: INC-041
title: Staff appoint stewards for a corridor, and a steward approves or rejects proposals inside it
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Contributors who have earned it become stewards for the corridors they know, and review other people's
proposals there — so review no longer waits on staff alone. Staff see who is ready to be promoted and make
the decision; staff can withdraw it at any time.

## Why now

INC-029..031 closed the contribution loop, but every decision still lands on MOT and admin, which
[ADR-018](../decisions/ADR-018-community-changes-are-reviewed-changesets.md) names as the programme's
throughput limit. `STEWARD` already exists in the schema and the enum and nothing grants it.

## Acceptance criteria

- [ ] Staff can appoint an active contributor as steward for one or more route groups, change the scope,
      and revoke it.
- [ ] Staff see a list of promotion candidates with their record; nobody is promoted without a staff action.
- [x] A steward sees and can approve or reject only proposals inside their corridors.
- [x] A steward can never decide their own proposal, and cannot revert an approval.
- [x] A steward does not see who proposed a change; staff still do.
- [x] Suspending a steward removes their authority on their next request.
- [x] A passenger who is not a steward is refused review exactly as before.
- [x] Tests named INC-041 cover each refusal against real Postgres.

## Out of scope

- The steward's own review workspace in passenger-web (INC-042) — this increment delivers the API and the
  staff-side appointment and candidates in the portal.
- Proposals for routes, schedules, operators, buses and service updates.
- Notifications.

## Constraints

- Changes who may write canonical reference data: R3, named reviewer required, no shared-environment
  migration run by an agent.
- Adds endpoints and response fields, so the generated core-service client must be regenerated.
- Decisions: [ADR-022](../decisions/ADR-022-a-changesets-corridor-is-derived-and-stewards-review-blind.md).

## Open questions

- Promotion thresholds (defaults: 10 approved, 80% approval rate, 30 days active, none reverted) are a
  starting guess for the pilot to correct.

## Decisions

- See ADR-022
