---
id: INC-044
title: A route or schedule can be recorded with only what is known, and says how complete it is
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Staff can create a route with just a name, or with endpoints and no stop list, and a schedule without a start
date, and each says whether its list is complete — so the Embilipitiya post's route headers can be entered
without inventing stops or dates.

## Why now

[ADR-023](../decisions/ADR-023-partial-knowledge-is-a-stored-state.md) is accepted. Every other piece of the
community-data programme (workings, staff import of the post, contributor proposals) presupposes that a route
and a schedule can exist incompletely.

## Acceptance criteria

- [ ] A route can be created with only a name; group, endpoints and direction are optional.
- [ ] A route created with both endpoints and no stop list gets those two as its stops.
- [ ] A route and a schedule each carry a completeness marker, `UNKNOWN` unless a person sets it, and it is
      returned by the API.
- [ ] A schedule can be created without a start date; it takes today's date.
- [ ] Updating a route or schedule without restating a group, endpoint, direction or start date leaves it as
      it was.
- [ ] A partial route does not break passenger search or any staff or passenger screen that shows a route.
- [ ] Tests named INC-044 cover each, against real Postgres.

## Out of scope

- Proposing routes or schedules as a contributor, importing them in bulk, and the passenger wording for the
  markers beyond a plain note. Workings (INC-045) and the staff import (INC-046) follow.
- A completeness marker for a schedule's operating days.

## Constraints

- Migration `V012` is additive: two `NOT NULL DEFAULT 'UNKNOWN'` columns. No row changes meaning, and it is
  not run against any shared environment by an agent.
- The five frontend files that dereference a route's endpoints without a null check ship guarded in this
  increment; CI has no frontend gate, so they are checked by hand.
- Adds fields to a published response, so the core-service client is regenerated.

## Decisions

- See ADR-023
