# ADR-008 · Operator-first go-to-market

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** strategy

## Context

BusMate can be sold to operators, to regulators, or built passenger-first. The founder has existing
relationships with private bus operators and familiarity with NTC and SLTB processes, so either of the
first two is reachable. The choice determines the first eighteen months and is expensive to reverse.

Market structure: SLTB as state operator, plus a large private sector that is overwhelmingly
**owner-operators with one to three buses**, organised loosely through route associations, with permits
issued by NTC (inter-provincial) or provincial authorities.

## Options considered

| Option | Assessment |
|--------|-----------|
| **Operator-first** — digital ticketing and crew accountability, priced on fare value | Cash leakage between conductor and owner is a **revenue** problem, so it survives a budget conversation. Uses the most mature domains. No hardware on day one. Needs nobody's permission |
| **Regulator-first** — registry, permits, compliance | 12–24 month sales cycles; tender qualification typically wants audited accounts and prior similar work. An unproven vendor with no deployed fleet loses. Winning early would consume the company |
| **Passenger-first** | No revenue of its own; permanent manual data cost; Google as direct competitor |

## Decision

**Operator-first**, sold to **route associations and depots** rather than individual owners, priced as a
percentage of fares processed (`F-1`) rather than as software licensing.

Individual owner-operators have no IT budget and no staff; associations and depots are the aggregation
points where one decision covers 50–500 buses.

## Consequences

- Revenue scales with usage, so a one-bus owner is affordable to serve.
- Generates the trip dataset that later makes `F-3` credible — the regulator conversation becomes "we
  already run 80 buses on this route, here is their on-time performance."
- **Conductor resistance is the key risk**: the product reduces leakage some crew may currently benefit
  from. The product must give crew something too — faster boarding, less cash handling, proof they are not
  the one skimming. Tracked as [`A-03`](../06-assumption-log.md).
- NTC/SLTB relationships are used for **intelligence, not sales**, during this phase — keeping `P-4`
  correctly designed years in advance.
- Company survival does not depend on any single government relationship.
- Live GPS tracking is deliberately deferred to `P-3` despite being the most impressive demo.

## Revisit when

- A funded government or donor programme appears that pays for the registry or passenger layer directly —
  that is contract revenue and should be taken, but it does not change the product bet, or
- [`A-04`](../06-assumption-log.md) fails and digital fare adoption proves too slow for `F-1`, forcing
  `F-2` to become the primary flow.
