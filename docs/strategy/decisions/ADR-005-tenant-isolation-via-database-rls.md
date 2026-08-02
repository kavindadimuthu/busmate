# ADR-005 · Tenant isolation enforced by database RLS

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** architecture

## Context

Inside a cell ([ADR-004](ADR-004-regional-cells-and-multi-tenancy.md)), competing operators on the same
corridor share infrastructure. They will never accept a system in which a rival might see their revenue —
tenant isolation is a **precondition of sale**, not a feature. It is also the failure that produces
headlines.

## Options considered

| Approach | Isolation | Cost |
|----------|-----------|------|
| Shared schema, `tenant_id` filtered **in application code** | Weak — fails **open** | Cheapest |
| Shared schema, `tenant_id` enforced by **database row-level security** | Strong — fails **closed** | Cheap |
| Database per tenant | Strongest | High, recurring |

## Decision

**Database-enforced row-level security as the default**, with database-per-tenant offered as a priced
premium tier.

- Tenant context is set on the connection at the start of each request.
- RLS policies exist on **every** tenant-scoped table.
- The default is **deny**: a query with no tenant context returns nothing, not everything.

Application-layer filtering is rejected because it depends on every developer remembering, on every query,
forever — including whoever is hired next year. RLS means the database refuses to return other tenants'
rows even when the query is wrong.

**Additionally required: an automated cross-tenant isolation suite in CI.** It authenticates as tenant A,
attempts to read tenant B's trips, revenue, staff and tickets by every reachable route, and **fails the
build if any attempt succeeds.** Written once, run forever.

## Consequences

- `tenant_id` must be on every operational table from the first migration. This is the single most
  expensive thing to retrofit in the entire system.
- The isolation suite plus the audit log (`PR-9`) is the answer to "how do I know my competitor cannot see
  my numbers?" — materially more persuasive than an architecture slide, and usable in a sales conversation.
- Reference data is **not** tenant-scoped ([ADR-006](ADR-006-reference-data-flows-inward-always.md)); the
  schema must keep the two clearly separated.
- Database-per-tenant customers must be priced at true cost, since each one is an ongoing operational
  liability.

## Revisit when

- A regulator or major customer requires cryptographic rather than logical separation as a contractual
  condition, or
- Tenant count in one cell reaches a scale where RLS policy evaluation becomes a measured performance
  problem.
