# ADR-016 · The runtime database role cannot bypass row-level security

**Date:** 2026-09-19 · **Status:** Proposed
**Type:** architecture

## Context

[ADR-005](ADR-005-tenant-isolation-via-database-rls.md) decided that tenant isolation is enforced by
row-level security, and `context.md` recorded it as an invariant. Checking while building vehicle
telemetry showed it was never implemented: no policies, no `tenant_id`, no tenant context on a
connection. Every service also connects as the `postgres` superuser. A superuser bypasses row-level
security unconditionally — `FORCE ROW LEVEL SECURITY` does not change that — so a policy added on top
of today's connections would read as protection and enforce nothing.

## Options considered

1. **Policies on the existing connection.** Cheapest; enforces nothing while the service is a
   superuser, which makes it worse than nothing because it looks done.
2. **Two roles: an owner that runs migrations, and a runtime role that serves requests** and is
   neither superuser, owner, nor `BYPASSRLS`.
3. **Database per operator.** Strongest, and the premium tier ADR-005 already reserves; too costly as
   the default.

## Decision

**Option 2**, piloted in telemetry-service. The runtime role is the only one requests use, so the
policies are the only thing between a caller and other operators' rows. Tenant context is set per
transaction with `SET LOCAL` so pooled connections cannot leak it. Policies deny by default. A service
that connects as anything other than the runtime role fails at startup.

This is the mechanism ADR-005 named, made real. It does not amend ADR-005; it records what "enforced by
row-level security" requires to be true.

## Consequences

- Every service that adopts this needs two credentials and a migration path that runs as the owner —
  a real change to deployment and secrets, which is why each adoption is its own increment.
- Existing application-level scoping (INC-016, INC-021) stays as defence in depth and is not removed by
  adoption; it stops being the control.
- A repeatable cross-tenant isolation suite becomes the proof, as ADR-005 requires.
- Until a service adopts it, its operator scoping is application-level and fails open. That is known
  debt, recorded in `context.md`.

## Revisit when

Row-level policy evaluation shows up as a measured cost in a cell, or a customer requires database-per-
tenant separation contractually.
