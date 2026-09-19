# ADR-018 · Community changes are reviewed changesets, applied through precedence

**Date:** 2026-09-19 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-017](ADR-017-community-contributors-produce-reference-data-before-p3.md) admits community
contributors as producers of reference data. [ADR-007](ADR-007-multi-source-ingestion-with-precedence.md)
decided every record carries `source_tier`, `observed_at`, `confidence` and `attribution`, and that a
higher tier supersedes a lower one — but none of it is built: no network table carries any of those
columns. The schema already anticipated community timetable data: `schedule_stop` has
`arrival_time_unverified`, `departure_time_unverified` and `*_unverified_by`, described in the API as
"from experienced users", and `route_stop` has `distance_from_start_km_unverified`. Nothing writes them.

The questions are how a contribution reaches the canonical network, what it carries, and how it is undone.

## Options considered

1. **Direct edit, moderated afterwards.** A contribution writes the canonical record; reviewers revert bad
   ones. Wrong data reaches passengers first, and an operator's rival needs only minutes of visibility.
2. **A separate community dataset reconciled at read time.** Already rejected in ADR-007 (option 3): every
   read path learns about every source.
3. **Changesets.** A contribution is a proposed change to one record, held apart from the canonical tables
   until a reviewer approves it; approval applies it through precedence and records how to undo it.
4. **Field-level provenance** — tier and attribution on every column. Most precise; multiplies the schema
   and every write path, for a precision nobody has asked for yet.

## Decision

**Option 3, with record-level provenance.**

- **Contributors never write canonical tables.** A changeset proposes creating or updating one stop,
  route or schedule. It carries the proposed values, the record's version and values when proposed, when
  and how the contributor observed it, and a note. Changesets live in core-service, which owns the network
  (invariant 2).
- **Provenance per record.** `stop`, `route`, `route_group` and `schedule` gain `source_tier`,
  `observed_at`, a base `confidence`, and an attribution (a contributor's user id, or an organisation
  label). `route_stop` and `schedule_stop` inherit their parent's. The changeset history gives
  field-level detail when someone needs it.
- **Community observations are `SRC-4`.** ADR-007 defined `SRC-4` as a field survey by our own team. An
  accepted contributor with a stated observation is the same kind of evidence gathered by a different
  person, so `SRC-4` becomes *field observation — by BusMate or an accepted contributor*. `SRC-5` stays
  what it was: reports from anyone, unverified.
- **Community times go into the existing unverified tier.** An approved timetable changeset writes
  `schedule_stop.*_unverified` (and `*_unverified_by`), never the authoritative time columns, which are
  reserved for `SRC-1`–`SRC-3`. An official time is therefore never overwritten by an observed one; the
  observation survives beside it as correction evidence.
- **Precedence on apply.** A changeset against a record whose tier outranks `SRC-4` is not applied. It is
  kept as a correction proposal for that record's owner (MOT today, the authority later).
- **Someone else approves.** The approver is never the author — for staff as much as for contributors.
- **Stale proposals are refused, not merged.** If the record changed after the proposal was made,
  approval is refused and the reviewer sees the current values.
- **Every applied change can be undone.** The pre-change values are kept; a revert is itself recorded,
  and is refused if the record has changed since.
- **Confidence decays at read time.** Effective confidence is computed from base confidence, tier and the
  age of `observed_at` whenever it is read, so no nightly job rewrites rows. Records whose effective
  confidence falls below a threshold are what the re-verification work queue is made of.

## Consequences

- The first increment of the programme is provenance itself, and it is useful without any community
  feature: staff-entered data gets labelled honestly.
- Passenger surfaces show a label derived from the record's tier and which time tier is displayed —
  *official*, *observed*, *reported — unverified*, *estimated*, and *live* only from telemetry — as
  [05 §6](../strategy/05-trust-and-data-policy.md) promises.
- Review becomes the throughput limit of the whole programme. That is intended at first; stewards and
  corroboration exist to raise it later, without dropping the approver-is-not-author rule.
- Staff edits through the existing portal stay direct, but must stamp provenance too — otherwise staff
  edits become the one unlabelled source.
- On acceptance: ADR-007's status line records that ADR-018 amends its `SRC-4` definition, and the
  `SRC-4` row in [05 §6](../strategy/05-trust-and-data-policy.md) reads *field observation*.
- The backlog item "three-tier data-quality columns are modelled but never written — build the
  verification queue or drop the columns" is answered: this is the verification queue.

## Revisit when

- Record-level provenance proves too coarse — for example, an authority needs to accept a name correction
  on a stop without accepting its moved position.
- An authority adopts and its data starts arriving as `SRC-1`, which turns the correction-proposal path
  into the main flow rather than the exception.
