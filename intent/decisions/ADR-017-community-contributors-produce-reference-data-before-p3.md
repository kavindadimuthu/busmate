# ADR-017 · Community contributors produce reference data ahead of the passenger phase

**Date:** 2026-09-19 · **Status:** Accepted
**Type:** strategy

## Context

The shared reference layer — stops, routes, timetables — is what every surface and every tenant reads
([ADR-006](ADR-006-reference-data-flows-inward-always.md)). Today only staff produce it, by hand. The
parties expected to produce it at scale are not available yet: an authority adopts at `T-3`, operators
arrive one association at a time, and neither will invest effort in a system that is not yet running.
Until then the network data covers little of the country and nobody outside BusMate checks it.

[ADR-007](ADR-007-multi-source-ingestion-with-precedence.md) already plans for lower-tier sources to fill
that gap, but its `SRC-4` is BusMate staff riding routes — recurring headcount a solo founder cannot fund —
and its `SRC-5` is passengers, who do not exist in number before `P-3`.

A third group exists now and is ignored by both: bus enthusiasts. Sri Lanka has active communities on
Facebook and other platforms that photograph buses, track route numbers and timetables, and correct each
other — unpaid, skilled, and motivated by the subject itself. They already do this work; it lands in
posts nobody can query.

[03 §3](../strategy/03-strategy-and-roadmap.md) puts passenger-side work on the stop list during `P-1`.
This decision is a deliberate exception to it, so it is recorded rather than drifted into.

## Options considered

1. **Wait** for operators and the authority to produce reference data. Honours the stop list; leaves the
   network thin for years, and every early demo runs on data nobody outside BusMate has checked.
2. **Paid field survey** (`SRC-4` as ADR-007 wrote it). Accurate, but cost scales with routes × re-survey
   frequency and has no end.
3. **Harvest social-media posts.** Breaches platform terms, gives no licence to the data, and no one is
   accountable for an entry.
4. **Open, unreviewed editing** in the style of a wiki. Fastest; the network is the record passengers act
   on, and private-operator rivalry gives people a motive to publish false timetables.
5. **A community contribution programme with a trust ladder and human review** — people apply, agree to a
   licence, propose changes, and earn review rights by track record.

## Decision

**Option 5.** Community contributors become a data-producing participant now, ahead of `P-3`, bounded as
follows:

- **Reference data only** — stops, routes, stop order and timetables. Never operator-private operational
  data (trips, revenue, staff, vehicles), never permits, never fares collected.
- **Always observed, never official.** Contributed data is labelled as observation on every surface, and
  yields to authority-issued or operator-supplied data automatically (ADR-007 precedence).
- **Every change is reviewed** by someone other than its author before the public sees it
  ([ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)).
- **Trust is earned, never assumed**, and granted by a human
  ([ADR-019](ADR-019-contributor-standing-lives-with-the-network.md)).
- **Continuous, not a one-off collection drive.** Data loses confidence as it ages, and ageing data becomes
  work for contributors. A programme with nothing left to do stops being a programme.
- **Proven small before it is built out.** A pilot with a handful of invited enthusiasts on one corridor
  runs on the first slice (propose and review stops) and tests `A-15` and `A-16` before stewards,
  recognition or task queues are built.

## Consequences

- **Builder time moves off the `P-1` wedge.** This is the real cost. It is justified only if the pilot
  shows contributors keep coming back; if it does not, the programme stops at the first slice.
- The correction dataset ADR-007 names — observed reality against what permits say — starts to accumulate
  long before any authority conversation, which strengthens that conversation.
- BusMate takes on community stewardship: a contributor agreement and data licence, moderation, a way to
  suspend someone and undo their work, and PDPA obligations for contributors' personal data. The agreement
  is a legal text and needs a human author before the first real contributor is accepted — it is part of
  the legal review under `A-13`.
- Operator rivalry is a known abuse vector. Declared affiliation, review by someone other than the author,
  and whole-contributor revert are the defences; none of them is optional.
- When an authority adopts, community observations do not disappear: they become correction proposals for
  the authority's review, as ADR-006 already anticipates.
- On acceptance, [03 §3](../strategy/03-strategy-and-roadmap.md) gains a line naming this exception.

## Revisit when

- The pilot falsifies `A-15` (contributors do not stay active) or `A-16` (reviewed data is not accurate
  enough to publish) — stop the programme at whatever slice is built.
- An authority publishes an authoritative national feed, which collapses most of the value of observed
  reference data.
- Review load exceeds what staff and stewards can clear within a week, persistently.
