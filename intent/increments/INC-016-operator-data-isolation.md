---
id: INC-016
title: An operator can reach only their own fleet, permit and trip records
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Every core-service record an operator can read or change is one that belongs to their own
operator, decided by the server from their access token — never by an ID the browser sends. MOT
and admin keep full access. Passenger search stays public.

## Why now

The operator portal processes ([design](../../docs/operator-portal-business-processes.md) §2) all
assume "own records only", and none of it is enforced: core-service lets anyone read every `GET
/api/**`, treats any bearer token as an admin in the dev profile, validates tokens against the
retired Asgardeo JWKS elsewhere, trusts the `{operatorId}` in operator URLs, and puts no role check
on bus/permit/trip writes. Everything else in the operator portal is built on top of this.

## Design

**core-service verifies the real access token itself** — RS256 against user-service's published
JWKS, the same key the gateway uses — and takes the caller's identity (`sub`) and role
(`app_metadata.user_type`) from it. The gateway's forwarded headers are not trusted for
authorisation. One filter serves every profile; the dev-only "any token is an admin" filter goes.

**The operator is resolved, not supplied.** A caller whose role is operator is mapped to their
core-service Operator through the existing `Operator.userId` link. Operator-scoped endpoints keep
their `{operatorId}` path shape, but a mismatch with the caller's own operator is refused; MOT and
admin may name any operator.

**Public reads are an explicit allow-list**: passenger search, health, stops, routes, schedules,
and a single bus or trip by id (passenger seat maps and ticket pages need those). Everything else
needs a login and the right role.

**The gateway strips any client-supplied `x-user-*` headers** before routing, so a public route can
never carry a forged identity to a service that reads them.

## Acceptance criteria

- [ ] An anonymous request to any fleet, permit, trip-list, operator or assignment endpoint is
      refused; passenger search, stops, routes, schedules and single bus/trip reads still work
      without a login.
- [ ] An operator calling an operator-scoped endpoint with another operator's id is refused (403),
      and the same call with their own id succeeds.
- [ ] A passenger or conductor token cannot create, update or delete a bus, permit, trip or
      operator.
- [ ] A conductor can read and start/complete only trips assigned to them.
- [ ] A request carrying a forged `x-user-id` header reaches no service with that value.
- [ ] Tests named INC-016 cover the above against real Postgres.

## Out of scope

- Conductor account scoping in user-service (INC-019) and ticket scoping in ticketing (INC-021).
- Database RLS for these tables (ADR-005) — application-layer only here.

## Constraints

- Public passenger flows (passenger-web, passenger-mobile) and conductor-mobile must keep working.
