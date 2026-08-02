# ADR-001 · Atomic unit is the trip

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** strategy

## Context

Every durable ecosystem is built around one repeated event that it becomes the authoritative record of.
Choosing that event determines the data model, the participant set, the revenue lines and the expansion
ceiling. It must be chosen before anything else, because every other decision inherits from it.

## Options considered

| Option | Ecosystem becomes | Ceiling |
|--------|-------------------|---------|
| **The trip** — one bus, one route, one departure | Operations system of record for public transport | Everything about running buses; hard to extend beyond scheduled transport |
| **The journey** — one passenger, origin → destination | Consumer mobility platform | Extends to any mode, but competes head-on with Google and PickMe |
| **The fare transaction** | Transport payments network | Extends to any fare-taking vehicle; regulated, needs a bank/PSP partner |
| **The permit / vehicle** | Regulatory compliance platform | Ends at the regulator's boundary; a single buyer |

## Decision

**The trip.**

It is the only candidate where the regulator, the operator, the crew and the passenger all hold a stake
in the *same record* — the condition that distinguishes an ecosystem from a product suite. The others are
derivable from it: a journey is composed of trips, a fare attaches to a trip, a permit authorises a trip.

## Consequences

- The trip becomes the join key for the entire data model; everything else references it.
- The fare and the permit become **layers on top**, not competing bases — the payments and compliance
  businesses stay reachable without being foundational.
- Scope questions gain a mechanical test: does the proposed thing attach to the trip?
  ([01 §3](../strategy/01-scope-constitution.md))
- Non-scheduled transport (ride-hailing, freight) is excluded by construction, which is intended —
  see anti-scope, [01 §6](../strategy/01-scope-constitution.md).
- The expansion thesis for `AX-3` is limited to scheduled passenger transport: bus, school, staff,
  tourist coach, long-distance van, eventually rail.

## Revisit when

- Scheduled transport ceases to be the dominant mode in target markets, or
- A market is entered where paratransit is genuinely unscheduled end-to-end, making "trip" a fiction.
