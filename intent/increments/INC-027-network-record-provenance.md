---
id: INC-027
title: Every stop, route and schedule says where it came from, when it was observed, and whom to credit
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Staff looking at a stop, route or schedule in the portal can see its source (official, operator,
observed, reported, estimated), when it was last observed, and who it is credited to — and every create,
edit or import records this automatically. Existing data is labelled honestly rather than left blank.

## Why now

Every later step of the community programme
([ADR-017](../decisions/ADR-017-community-contributors-produce-reference-data-before-p3.md)) publishes
data whose trustworthiness differs by source, and
[ADR-007](../decisions/ADR-007-multi-source-ingestion-with-precedence.md) promised provenance on every
record — but no network table has a source, date or attribution column. Without them the first approved
community stop would be indistinguishable from a staff-entered one. It is also the only step that
changes existing tables; doing it before any community table exists keeps that migration small.

## Design

Direction in [ADR-018](../decisions/ADR-018-community-changes-are-reviewed-changesets.md).

- **Four provenance fields** on `stop`, `route`, `route_group` and `schedule`: `source_tier`
  (`SRC_1`…`SRC_6`, checked), `observed_at`, `base_confidence` (0–100), and attribution as
  `attributed_user_id` (nullable) plus `attribution_label` (display text, such as "BusMate" or an
  organisation). `route_stop` and `schedule_stop` inherit from their parent and gain nothing.
- **Backfill.** Every existing row becomes `SRC_4`, attributed to "BusMate", observed at its `updated_at`
  (else `created_at`), confidence 50. No existing data is known to come from a gazette, so none is
  labelled official.
- **Writes stamp provenance.** A create through the existing controllers defaults to `SRC_4` "BusMate",
  observed now. An edit keeps the record's source and moves `observed_at` to now, with two exceptions
  where the old credit no longer describes the data and the record falls back to `SRC_4` "BusMate": an
  official record edited by anyone but `mot`, and a contributor-credited record edited by staff. Only
  `mot` may record `SRC_1`; staff may record only `SRC_1`–`SRC_4`. Stop, route and schedule imports take a
  tier for the whole file, checked once so a forbidden tier refuses the whole file. A route group's
  routes take the group's provenance. A caller can never set `attributed_user_id` directly. A JPA
  `PrePersist` default is the net under any write path that does not stamp, so no record is stored
  unlabelled.
- **Read.** Staff-facing stop, route, route-group and schedule responses carry a `provenance` object.
  Passenger responses are INC-028.
- **Portal.** A provenance badge on the MOT stop, route-group and schedule lists and detail pages: tier
  name, observed date, credit. The stop form, the route-group submission step, the schedule form and the
  stop and route import pages get a source selector for MOT accounts only; the backend, not the selector,
  enforces who may choose what.

## Acceptance criteria

- [x] Every existing stop, route, route group and schedule has provenance after migrating, labelled
      observed and credited to BusMate; none is labelled official.
- [x] Creating or editing any of them through the portal records the source, the time and the credit
      without the user typing them.
- [x] Only an MOT account can mark a record official; an admin who tries is refused.
- [x] An imported file's records all carry the source chosen for that import.
- [x] The MOT stop, route and schedule lists and detail pages show each record's source, observed date
      and credit.
- [x] Tests named INC-027 cover the backfill, stamping on write, and the official-tier restriction
      against real Postgres.

## Out of scope

- Showing provenance to passengers (INC-028).
- Confidence decay over time; per-field provenance; provenance on fleet, permits or anything
  operator-owned.
- Filtering lists by source.

## Constraints

- **`always_human` stops apply.** Adds a migration to a shared table and changes a published contract:
  regenerate the core-service client in `libs/api-clients`, and run no migration on a shared environment.
  Named reviewer required.
- Additive only: existing API consumers that ignore `provenance` keep working.
- Backend tests use real Postgres via Testcontainers.

## Open questions

- Is any existing network data actually copied from an NTC or provincial gazette? If so, which records
  should be backfilled as `SRC_1` instead — the owner's call, not the agent's.

## Decisions

- See ADR-007, ADR-018
