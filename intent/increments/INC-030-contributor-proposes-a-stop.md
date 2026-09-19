---
id: INC-030
title: A contributor proposes a new stop or a correction to one, and follows it until it is decided
state: shaped
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

An active contributor on passenger-web can propose a new stop, or correct an existing one — its names in
English, Sinhala and Tamil, its position on a map, city and accessibility — saying when and how they
observed it. They see all their proposals and each one's status, and can withdraw one that is still
pending.

## Why now

Stops are the smallest self-contained piece of the network and the thing enthusiasts know best, so they
are the first changeset type. Together with INC-031 this is the slice the ADR-017 pilot runs on, and it
exercises the whole changeset model before routes and timetables reuse it.

## Design

Direction in [ADR-018](../decisions/ADR-018-community-changes-are-reviewed-changesets.md).

- **A generic changeset table** in the community module: entity type (only `STOP` accepted for now),
  target id (null for a new stop), action (`CREATE`, `UPDATE`), proposed values (JSON, validated with the
  same rules as a staff stop request), the target's version and values when proposed, observed-on date,
  observation method (rode the route / lives or works nearby / timetable or signboard / told by crew / other),
  note, status (`PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`), proposer, and decision fields for INC-031.
- **Only active contributors** may create; standing is checked in core-service on every request (INC-029).
- **Duplicate warning.** Proposing a new stop within 50 m of an existing one with a similar name shows that
  stop and asks the contributor to confirm, or to correct it instead.
- **Limits.** One pending proposal per contributor per stop, and a daily cap on new proposals per
  contributor.
- **passenger-web "Contribute" workspace** (the home for contributors from here on): *My contributions* as
  a list with status chips and filters, and *Propose a stop*, which lets the contributor search an existing
  stop to correct (the form is pre-filled and changed fields are highlighted) or start a new one. The map
  picker is draggable, with a "use my location" button. A proposal's detail page shows what was proposed
  against what was there, its status, and the reviewer's reason once decided.

## Acceptance criteria

- [ ] An active contributor can propose a new stop and a correction to an existing stop; anyone else —
      reporter, suspended, declined, staff — is refused.
- [ ] A proposal with invalid values (missing English name, position outside Sri Lanka) is refused with a
      message saying what to fix.
- [ ] Proposing a new stop next to a similarly named existing one warns before submitting.
- [ ] Nothing a contributor proposes changes the stop that staff or passengers see.
- [ ] The contributor sees every proposal they made, its status, and can withdraw a pending one.
- [ ] Tests named INC-030 cover permission, validation, the duplicate warning and the limits against real
      Postgres.

## Out of scope

- Reviewing or applying proposals (INC-031). Evidence photos (a later increment).
- Proposing to delete or merge stops — "this stop no longer exists" is a report, later.
- Proposing on mobile (a later field-capture increment).

## Constraints

- Depends on INC-029.
- The changeset table is shared by routes and schedules later: keep entity-specific rules out of it.
- New tables via Flyway only; regenerate the core-service client. Named reviewer required.

## Open questions

- None open.

## Decisions

- See ADR-018, ADR-019
- passenger-web uses `@react-google-maps/api`, the library the portal already uses, with the same key
  approach — chosen by the owner 2026-09-19.
