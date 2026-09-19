---
id: INC-028
title: A passenger can tell whether a route or departure time is official, observed or unverified
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A passenger looking at a route or a departure time in passenger-web or passenger-mobile sees a
plain label saying how far to trust it — official, observed, reported (unverified), estimated or live —
and when it was last confirmed, with one tap to find out what the labels mean.

## Why now

[05 §6](../strategy/05-trust-and-data-policy.md) promises passengers exactly this, and ADR-017 makes it
a condition of publishing any community data. INC-027 records provenance but shows it only to staff; the
first approved community stop (INC-031) must not reach a passenger unlabelled. Today passenger surfaces
show every time as if it were equally certain.

## Design

- **One label per displayed value**, derived on the server so both apps agree:

  | Displayed value comes from | Label |
  |---|---|
  | Authoritative time column, record `SRC_1` | Official |
  | Authoritative time column, record `SRC_2`/`SRC_3` | Operator timetable |
  | Authoritative time column, record `SRC_4` | Observed |
  | `*_unverified` column | Reported — unverified |
  | `*_calculated` column | Estimated |
  | Live position/ETA from telemetry | Live |

- **Passenger query responses** (route search, find-my-bus, route detail) gain `trust` beside each time and
  on the route: label key plus observed date. Label keys, not English strings, so each app translates.
- **Where the label is computed.** One mapper, `TrustLabels`, on the server; the authoritative column takes
  its record's label, `*_unverified` is always *reported*, `*_calculated` always *estimated*, and only a
  vehicle position is *live*. Responses carry the label key and the observed date, never wording.
  Passenger-facing responses: find-my-bus results, find-my-bus-details (route, timetable, every stop time,
  journey summary, live info) and the public route read.
- **passenger-web**: a chip beside times, in the timeline and on the timetable and route panels; a
  "last confirmed" date on the route page; a "What do these labels mean?" dialog from the results, the
  detail page and the route page. Replaces the detail page's single-letter V/U/C badges, whose tooltip
  called every verified time "verified by official sources".
- **passenger-mobile**: the same chips on results and schedule; a phone has no hover, so tapping a chip
  opens a bottom sheet explaining every label, with the tapped one's confirmed date.
- **The public reads must not name a contributor.** The stop, route and schedule reads are
  unauthenticated, so `attributedUserId` is removed from the provenance they return (INC-027 had added
  it); only the display credit remains.
- **Tone**: labels inform, never alarm. "Observed · 3 Sep 2026", not a warning icon.

## Acceptance criteria

- [x] Every departure time a passenger sees carries a label from the table above, and the label matches
      where the time actually came from.
- [x] A route shows when its data was last confirmed.
- [x] No passenger surface shows a scheduled or observed time labelled as live.
- [x] The explainer is reachable from every screen that shows a label, on web and mobile.
- [x] Both apps show the same label for the same time.
- [x] Tests named INC-028 cover the label derivation for each row of the table.

## Out of scope

- Crediting individual contributors by name on public pages (a later recognition increment).
- Labels on individual stops; passenger-mobile's route browsing (it has none) and live-tracking map.
- Translating the labels: neither app has a translation layer yet.
- Hiding low-confidence data; confidence decay.

## Constraints

- Depends on INC-027 being merged.
- Published contract change: regenerated the core-service client. Both passenger apps consume it as a
  workspace package, so there is no separate copy to update.
- Passenger query stays auth-free and in one query; the label is derived in that query, not by an extra
  call per row.

## Open questions

- None open.

## Decisions

- See ADR-018
- passenger-mobile is type-checked against the workspace client but was not run on a device: the owner
  waived that check on 2026-09-19. (It cannot run on web — `react-native-maps` is native-only.)
- English-only labels on both apps — neither has a translation layer; decided during INC-028 because
  the server sends keys, so translating later touches only the apps.
