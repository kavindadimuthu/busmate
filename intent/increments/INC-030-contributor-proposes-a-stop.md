---
id: INC-030
title: A contributor proposes a new stop or a correction to one, and follows it until it is decided
state: in-review
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

- **A generic `changeset` table** (V009) in the community module: entity type (only `STOP` accepted for
  now), target id (null for a new stop), action (`CREATE`, `UPDATE`), proposed values (jsonb), the
  target's version and values when proposed (jsonb snapshot, both null for `CREATE`), observed-on date,
  observation method, note, status (`PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`), proposer, and
  decision fields left empty for INC-031 to fill.
- **Only active contributors** may create; `ContributorStanding` (INC-029) is checked fresh on every
  request. A position outside Sri Lanka's bounding box is refused.
- **Duplicate warning.** A new stop within 50 m of an existing one whose name matches (fully, as a
  substring, or by first word — abbreviations like "Jn" for "Junction" don't share a character prefix,
  so a plain substring check misses them) returns that stop as a candidate instead of creating anything;
  the contributor resubmits with `confirmDuplicate` to proceed anyway. Never applies to a correction.
- **Limits.** One pending proposal per contributor per stop (a database unique index, not just app
  logic), and a daily cap across all of a contributor's proposals (`community.proposals.daily-cap`,
  default 20).
- **passenger-web "Contribute" workspace**: *My contributions* (`/contribute/mine`) as a list with
  status chips and filters, and a detail page showing what was proposed — diffed against the stop's
  values at proposal time for a correction — its status, and the reviewer's reason once decided, with a
  withdraw button while pending. *Propose a stop* (`/contribute/propose`) lets the contributor search an
  existing stop (via the public, auth-free passenger stop search) to correct — the form pre-fills and
  changed fields are ringed — or start a new one. The map picker (`@react-google-maps/api`) is a
  draggable pin with a "use my location" button backed by the browser's geolocation.

## Acceptance criteria

- [x] An active contributor can propose a new stop and a correction to an existing stop; anyone else —
      reporter, suspended, declined, staff — is refused.
- [x] A proposal with invalid values (missing English name, position outside Sri Lanka) is refused with a
      message saying what to fix.
- [x] Proposing a new stop next to a similarly named existing one warns before submitting.
- [x] Nothing a contributor proposes changes the stop that staff or passengers see.
- [x] The contributor sees every proposal they made, its status, and can withdraw a pending one.
- [x] Tests named INC-030 cover permission, validation, the duplicate warning and the limits against real
      Postgres.

## Out of scope

- Reviewing or applying proposals (INC-031). Evidence photos (a later increment).
- Proposing to delete or merge stops — "this stop no longer exists" is a report, later.
- Proposing on mobile (a later field-capture increment).
- A dedicated GET-one-proposal endpoint: the detail page reuses the "mine" list and filters
  client-side, fine at pilot scale; a real endpoint can follow if the list grows large.

## Constraints

- Depends on INC-029.
- The changeset table is shared by routes and schedules later: keep entity-specific rules out of it.
- New tables via Flyway only; regenerate the core-service client. Named reviewer required.

## Open questions

- None open. One gap found and left for the owner to close: `passenger-web/.env` has no
  `VITE_GOOGLE_MAPS_API_KEY` (only `new-react-portal/.env` does) — the map picker needs one to render
  outside this session's manual override; add the key to `passenger-web/.env` before anyone but a
  developer with that override uses this page.

## Decisions

- See ADR-018, ADR-019
- passenger-web uses `@react-google-maps/api`, the library the portal already uses, with the same key
  approach — chosen by the owner 2026-09-19. Added to `passenger-web/package.json`; the exact version
  already resolved in the workspace lockfile (`^2.20.8`, matching the portal), so no new version was
  introduced.
- Live-verified end to end 2026-09-20: an active contributor proposed a new stop with a real map pin,
  searched for and corrected a real seeded stop (pre-fill and change-highlighting both confirmed), saw
  both in *My contributions*, and withdrew one; a non-contributor's proposal attempt was refused with
  403 through the real gateway.
