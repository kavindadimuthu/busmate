---
id: INC-054
title: Confidence decays at read time, as ADR-018 promised
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A record's confidence is computed from its base confidence, its source tier and how long ago it was
observed, every time it is read — and staff can see it, and see when it has decayed enough to be worth
re-checking.

## Why now

ADR-018 named this as part of the design in 2026; `base_confidence` has been written on every record since,
and never read. It is the last piece of that design not built, and it is small on its own.

## Acceptance criteria

- [x] Effective confidence is a pure function of tier, base confidence and age — nothing is stored or
      scheduled; reading the same record twice a day apart gives two different answers.
- [x] It never rises, and never falls below a floor: an old record still says something, just less.
- [x] Each source tier decays at its own rate: official data barely moves in a year; a passenger report
      is mostly gone in two months.
- [x] A staff member sees it on a record's Data Source panel, with a plain warning once it has decayed
      past the point a fresh passenger report would already be at.
- [x] Unit tests cover the decay curve, the floor, the per-tier difference and missing-input behaviour.

## Out of scope

- The re-verification work queue ADR-018 named as the point of this — a list of records below the
  threshold. This is the piece that makes such a list possible; the list itself is a separate increment.
- Passenger-facing display: `TrustLabel` (what a passenger sees) is unaffected by age on purpose — a
  passenger sees "Observed", not a percentage.
- Tuning the specific half-life numbers against real usage; they are a documented starting point.

## Decisions

- Half-lives chosen per tier (documented on `SourceTier`), floor of 10: implementation detail of the
  already-accepted ADR-018, not a new decision needing its own ADR.
