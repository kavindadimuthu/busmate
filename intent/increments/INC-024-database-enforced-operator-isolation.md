---
id: INC-024
title: One operator's vehicle data is invisible to another operator because the database refuses it
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Telemetry-service reads vehicle state through a database role that cannot see other operators' rows,
so an operator asking for another operator's bus gets nothing even if the query is wrong — and staff
can read vehicle state for the buses they are entitled to. This is the first place the platform
enforces tenant isolation in the database rather than in code.

## Why now

[ADR-005](../decisions/ADR-005-tenant-isolation-via-database-rls.md) says isolation is enforced by
row-level security and `context.md` claimed it was. It is not built anywhere: no policies, no tenant
context, and every service connects as the `postgres` superuser, which bypasses row-level security
even on tables that force it. INC-023 starts storing operator-tagged vehicle data and cannot expose it
until this exists; INC-016 and INC-021 scoped by operator in application code, which fails open.
Telemetry-service is the right pilot: newest schema, smallest surface, and no read path to migrate.

## Design

Direction in [ADR-016](../decisions/ADR-016-runtime-database-role-cannot-bypass-row-level-security.md).

- **Two database roles.** An owner role runs Flyway and owns the tables; a runtime role — neither
  superuser nor owner, without `BYPASSRLS` — serves requests. Migrations create a password-less group
  role that holds every privilege the runtime needs; the login role that belongs to it is provisioned
  outside migrations, so no credential is ever committed. The service holds both connections.
- **Tenant context per transaction.** Each transaction declares who is acting — the ingest pipeline,
  staff, or one operator — with `set_config(..., true)`, which cannot outlive the transaction, so a
  pooled connection cannot carry one caller's context to the next. Declaring it outside a transaction
  is an error. An operator's id comes from core-service on every request, uncached, so an unlinked
  operator is refused at once.
- **Policies deny by default.** On both vehicle tables: reads show an operator their own rows, staff and
  the ingest pipeline every row; only the ingest pipeline may write. With no context declared, nothing
  is visible and nothing writable. Forced on the table owner too. An untagged row (operator unknown at
  ingest) is visible to staff, never to an operator.
- **Authorisation from the gateway's identity, not the profile.** In `dev` telemetry-service treats any
  bearer token as admin, so the read path decides from the gateway-verified identity headers itself.
  Missing or unrecognised identity is refused.
- **Fail loudly on a privileged runtime.** At startup the service refuses to run if its runtime role is
  a superuser, bypasses RLS, or owns the vehicle tables.
- **The first read path.** Staff read of the latest vehicle state for a bus, and for the buses they
  are entitled to, served through the runtime role. It never appears on the open live-position read
  or stream.
- **The isolation suite ADR-005 requires.** Against real Postgres: authenticate as operator A, try to
  read operator B's vehicle state by every reachable route, fail the build if any attempt succeeds.

## Acceptance criteria

- [ ] An operator's read returns only their own buses' vehicle state, however the request is shaped;
      another operator's bus is indistinguishable from one that does not exist.
- [ ] MOT and admin read every operator's; a passenger, conductor or unauthenticated request is
      refused.
- [ ] With no tenant context on the transaction, the runtime role reads no rows and writes none; an
      operator context cannot write at all.
- [ ] The runtime role cannot bypass the policy: it is not a superuser, owns nothing, and cannot
      disable row-level security or alter the policy.
- [ ] A pooled connection reused for a different caller carries none of the previous caller's context.
- [ ] An operator whose own operator link cannot be confirmed is refused, not shown everything.
- [ ] The service refuses to start when its runtime role is privileged.
- [ ] The isolation suite exists, runs in the Backend CI gate, and fails when a policy is removed.
- [ ] Tests named INC-024 cover the above against real Postgres.

## Out of scope

- Extending row-level security to core-service, user-service and ticketing-service — each has existing
  application-level scoping to migrate carefully; separate increments, in the backlog.
- Database-per-tenant, cryptographic separation, and the audit log.
- Alert rules and any portal screen for vehicle health.

## Constraints

- **`always_human` stops apply.** This adds database roles and their credentials under
  `config/secrets` and changes what the service connects as; named reviewer required, and no role or
  migration is applied to any shared environment by an agent.
- Backend tests use real Postgres via Testcontainers — no H2, so the policies under test are the real
  ones.
- Production and dev must connect as the runtime role; a deploy that falls back to the owner or
  superuser must fail loudly, not run unprotected.

## Open questions

- Production credential rollout: the two roles are provisioned by a script and documented, but creating
  them on a shared database is a human step this increment does not perform.

## Decisions

- See ADR-016
