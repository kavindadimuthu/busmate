# ADR-003 · Modular monolith over microservices

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** architecture

## Context

Given [ADR-002](ADR-002-decompose-by-data-not-by-product.md), the domain layer has roughly seven bounded
contexts. Whether those become separate deployables or modules in one deployable is a separate question,
and it is frequently answered by fashion rather than by need.

The repository today runs four Spring Boot services plus a gateway — cut along the **correct** axis (by
data, not by product), which is the part most teams get wrong. The open question is only the number of
deployables, not the boundaries.

## Options considered

1. **Microservices** — one deployable per domain.
2. **Modular monolith** — one deployable, internally partitioned along the same boundaries.
3. **Full-stack app per product** — rejected by [ADR-002](ADR-002-decompose-by-data-not-by-product.md).

## Decision

**Modular monolith**, with boundaries at the domain lines: separate packages, separate schemas or at
minimum exclusive table ownership, modules communicating through explicit interfaces, and **no module
reaching into another module's tables**. BFFs may begin as controller groups in the same deployable.

Microservices solve an **organisational** problem — many teams deploying without coordinating. BusMate is
one person. The full distributed-systems tax (network failure handling, eventual consistency, distributed
tracing, versioned contracts, N pipelines, local dev needing many containers) would be paid for none of
the benefit. A schema change that is a ten-minute refactor becomes a multi-service coordinated release, at
exactly the stage when the domain model changes constantly. A cross-domain query is a join here and a
distributed aggregation there.

## Consequences

- Refactoring stays cheap while the domain model is still moving.
- **Module boundaries must stay honest** — that is the entire cost of this decision, and the only thing
  that keeps later extraction to a few weeks' work. A monolith without real boundaries never becomes
  anything else.
- Existing separate services may remain as they are; consolidating them is reversible either way and
  therefore not urgent. The boundaries are the expensive part and they are already right.

## Revisit when — extract a service if any of these becomes true

- **Independent scaling** is genuinely needed. Telemetry is the expected first extraction: position pings
  run at a completely different volume from everything else.
- **A separate team** owns a domain and deploy coordination is measurably hurting.
- **Different reliability or regulatory blast radius** is required — settlement is the likely candidate.
- A domain genuinely needs a **different runtime** for real technical reasons.

"It feels cleaner" and "that is what real companies do" are explicitly not triggers.
