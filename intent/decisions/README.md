# Decision Records

> **What this is.** An append-only log of significant decisions — architectural, strategic and commercial —
> each with the context that produced it, the options considered, and the trigger that should cause it to
> be revisited.

## Rules

1. **Never edit a record. Never delete one.** When a decision changes, write a new record that supersedes
   it and update the old record's `Status` line only.
2. **The reasoning is the asset; the conclusion is disposable.** In six months the question is not *what*
   was decided but *why*, and whether the reason still holds.
3. **Every record carries a `Revisit when` trigger.** A decision without one silently becomes dogma.
4. Numbering is sequential and permanent. Gaps are fine.

## Template

```markdown
# ADR-nnn · Title

**Date:** YYYY-MM-DD · **Status:** Proposed | Accepted | Superseded by ADR-nnn
**Type:** architecture | strategy | commercial

## Context
## Options considered
## Decision
## Consequences
## Revisit when
```

## Log

| ID | Title | Type | Status |
|----|-------|------|--------|
| [ADR-001](ADR-001-atomic-unit-is-the-trip.md) | Atomic unit is the trip | strategy | Accepted |
| [ADR-002](ADR-002-decompose-by-data-not-by-product.md) | Decompose the backend by data ownership, not by product | architecture | Accepted |
| [ADR-003](ADR-003-modular-monolith-over-microservices.md) | Modular monolith over microservices | architecture | Accepted |
| [ADR-004](ADR-004-regional-cells-and-multi-tenancy.md) | Regional cells with logical multi-tenancy | architecture | Accepted |
| [ADR-005](ADR-005-tenant-isolation-via-database-rls.md) | Tenant isolation enforced by database RLS | architecture | Accepted |
| [ADR-006](ADR-006-reference-data-flows-inward-always.md) | Reference data flows inward always | architecture | Accepted |
| [ADR-007](ADR-007-multi-source-ingestion-with-precedence.md) | Multi-source ingestion resolved by precedence | architecture | Accepted |
| [ADR-008](ADR-008-operator-first-go-to-market.md) | Operator-first go-to-market | strategy | Accepted |
| [ADR-009](ADR-009-self-hosted-s3-compatible-media-storage.md) | Media lives in self-hosted, S3-compatible object storage | architecture | Accepted |
| [ADR-010](ADR-010-payhere-for-conductor-card-payments.md) | PayHere is the PSP for conductor-collected card payments | architecture | Accepted |
| [ADR-011](ADR-011-revenue-grouped-by-custody-listed-by-method.md) | Revenue is grouped by custody and listed by payment method | architecture | Accepted |
| [ADR-012](ADR-012-tickets-grouped-by-sale-stage-listed-by-channel.md) | Tickets are grouped by sale stage and listed by sale channel | architecture | Accepted |
| [ADR-013](ADR-013-passenger-fares-collect-centrally-settle-periodically.md) | Passenger fares collect into one BusMate account and settle to operators periodically | commercial | Accepted |
