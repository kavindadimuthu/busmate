# ADR-006 · Reference data flows inward always

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** architecture

## Context

Some operators will be skeptical about sharing data and will adopt only on condition that nothing leaves
their boundary (`S-0`, see [05](../strategy/05-trust-and-data-policy.md)). That must be supported — but even a
fully private operator needs stops, routes and schedules.

If such an operator maintains their own private copy of reference data, integrating them into the regional
ecosystem later becomes an **entity-reconciliation project**: matching their "Nugegoda Junction" to the
canonical "Nugegoda" across tens of thousands of records, with human judgement on ambiguous cases. That is
one of the most expensive kinds of work in software, and it is exactly the work that gets deferred until
it never happens.

## Options considered

1. Each isolated tenant owns a private copy of reference data.
2. **Asymmetric sync** — reference data always flows in; operational data flows out only by consent.
3. Refuse to serve fully isolated operators.

## Decision

**Option 2.**

```
   REGIONAL CANONICAL REFERENCE LAYER
   stops · routes · official schedules · fares
                    │
                    │  always flows DOWN — read-only mirror
                    ▼
        ┌───────────────────────────┐
        │   ISOLATED TENANT         │
        │   trips · revenue · staff │
        └───────────────────────────┘
                    ╎
                    ╎  flows UP only when the sharing tier is raised
                    ▼
              REGIONAL ECOSYSTEM
```

Reference data comes **in**, always, for every tenant including the most private. Operational data goes
**out** only at sharing tier `S-1` and above.

## Consequences

- **The cost of integrating a customer later is decided today.** With this decision, later integration is
  flipping a switch and signing an addendum — days. Without it, months of reconciliation.
- Sharing becomes a **permission setting, not an architecture**. Every partial-adoption scenario in
  [02 §5](../strategy/02-business-model.md) reduces to configuration.
- Reference data must be schema-separated from tenant data, reinforcing
  [ADR-005](ADR-005-tenant-isolation-via-database-rls.md).
- **Never a separate instance per operator.** Per-operator deployments fragment reference data
  permanently, make the passenger layer impossible, and destroy corridor density — the only real network
  effect ([03 §4](../strategy/03-strategy-and-roadmap.md)). One regional deployment, many tenants.
- Before an authority adopts, BusMate is de facto steward of the route network — asserting what exists
  without statutory authority. Handled by provenance (`PR-6`,
  [ADR-007](ADR-007-multi-source-ingestion-with-precedence.md)): pre-authority data is labelled *observed*,
  never *official*, and becomes a proposal queue when the authority joins.

## Revisit when

- An authority contractually requires that its reference data not be mirrored to non-participating
  operators — at which point the mirror becomes scoped rather than removed.
