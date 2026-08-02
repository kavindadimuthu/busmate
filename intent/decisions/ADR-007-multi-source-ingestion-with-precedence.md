# ADR-007 · Multi-source ingestion resolved by precedence

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** architecture

## Context

The passenger layer consumes data it does not generate ([02 §2](../strategy/02-business-model.md)). In a region
with low BusMate adoption there are no operators producing trips, yet the passenger app must still be
useful — that is what creates the pull that brings operators in.

Data will therefore arrive from very different sources at different times: manual field surveys early,
operator feeds as adoption grows, authority-issued data if and when an authority adopts. The naive path is
to start with manual entry and "add other sources later", which turns every adoption milestone into a
migration.

## Options considered

1. Single-source ingestion, migrated as adoption grows.
2. **Many sources → one canonical record, resolved by precedence**, with provenance on every record.
3. Separate datasets per source, reconciled at read time.

## Decision

**Option 2.** Every reference and real-time record carries `source_tier`, `observed_at`, `confidence` and
`attribution`. A higher tier automatically supersedes a lower one for the same entity.

| Tier | Source | Trust | Available when |
|------|--------|-------|----------------|
| `SRC-1` | Authority-issued — gazetted routes, permits, official timetables | Highest | Authority adopts (`T-3`+) |
| `SRC-2` | Operator on BusMate — live trip execution, actual times | Highest operational | Any operator at `S-1`+ |
| `SRC-3` | Operator not on BusMate — shared file or feed (CSV, GTFS, API) | High | Willing non-customer |
| `SRC-4` | Field survey — our team rides the route and records it | Medium, decays | Always, at a cost |
| `SRC-5` | Crowdsourced — passenger reports and corrections | Low individually, good in aggregate | Once there are users |
| `SRC-6` | Derived — inferred from historical patterns | Lowest, better than nothing | Always |

**Precedence, not migration.** Growing adoption is simply higher-tier data arriving and winning. Nothing
is ever rewritten.

**Confidence is displayed honestly** in passenger surfaces: *scheduled* · *reported* · *live*. A passenger
told "this is a scheduled time, not live tracking" forgives a late bus; one promised live tracking who
gets a stale time uninstalls and tells their friends.

## Consequences

- A region can be launched long before it has good data, which is what makes the laddered adoption
  strategy possible at all.
- **Crowdsourcing becomes a growth loop** — passengers improve the data that serves passengers, at no
  marginal cost.
- `SRC-4`/`SRC-5` data accumulates into the **correction dataset** used in the authority pitch: observed
  reality across hundreds of routes versus what the permits say. Nobody else in the country has it, and it
  arrives as a by-product.
- **Manual data carries recurring headcount cost** — routes change, stops move, timetables drift. Model it
  as routes × re-survey frequency × cost per survey.
- Gives the central operating metric:
  > **Adoption score = % of passenger-facing records sourced at `SRC-1`–`SRC-3`.**
  One number that measures ecosystem adoption, predicts data quality, and tracks the falling cost base.
- Liability: publishing wrong times at scale requires the confidence labelling above plus disclaimers.

## Revisit when

- A national open-data feed (GTFS or equivalent) becomes authoritative, which would collapse `SRC-1` and
  `SRC-3` into one tier and change the economics of `SRC-4` entirely.
