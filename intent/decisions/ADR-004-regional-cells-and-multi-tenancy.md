# ADR-004 · Regional cells with logical multi-tenancy

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** architecture

## Context

BusMate will sell to authorities, operators, companies and researchers across multiple regions and
eventually multiple countries. Two obvious topologies exist, and both fail.

## Options considered

| Option | Fails on |
|--------|----------|
| **Single global cloud, one database** | **Law, not engineering.** Data residency rules and government procurement block it — a transport ministry is precisely the customer most likely to require in-country hosting. Loses the highest-value deals on a technicality |
| **A deployment per customer** | **Economics.** N deployments to upgrade, monitor, back up and debug forever; no shared reference layer, so no passenger aggregation and no corridor density; margins collapse with growth |
| **Regional cells** | — |

## Decision

**One deployment per jurisdiction ("cell"), multi-tenant inside, from a single codebase and a single
control plane.**

- **Control plane** (one, global): tenant registry, licensing, billing, release orchestration, deployment
  automation, aggregate health. **Metadata only — no personal or operational data.** The moment it holds
  passenger or revenue data, the residency guarantee collapses and it becomes the single global database
  this decision avoids.
- **Data plane** (per cell): everything else. Own database, own keys, own backups. Data never leaves.

Four boundary levels: **cell** (hard, physical) → **region** (soft, scopes the shared reference layer) →
**tenant** (hard, logical — see [ADR-005](ADR-005-tenant-isolation-via-database-rls.md)) → **user/role**.

## Consequences

- Data residency becomes a **sales enabler**, not just compliance — in-country hosting can be offered
  contractually.
- **A cell is a jurisdiction, not a customer.** Cells carry fixed cost and need a minimum revenue base;
  several small markets may share one where law permits. Create a cell only for a legal residency
  requirement, a contractual in-country demand, or genuine scale/latency need.
- Cells must be creatable **by script** (`PR-7`), target under a day. If standing up a country takes
  weeks, country two cannot be sold and this architecture is theoretical.
- **Never hand-modify a cell** — a hand-patched cell is a fork with extra steps, and it will be the one
  that breaks.
- No global user identities: identity is per-cell. Backups inherit residency — a backup replicated across
  a border silently breaks the guarantee sold.
- Jurisdiction differences (retention, consent, erasure, breach deadlines, transfer rules) are handled as
  **policy profiles** (`PR-4`), not code.

## Revisit when

- A second jurisdiction is actually signed — at which point the control plane graduates from a config
  table to real software, and the deferred items in [04 §5](../strategy/04-architecture-principles.md) become due.
