---
id: INC-028
title: A passenger can tell whether a route or departure time is official, observed or unverified
state: shaped
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A passenger looking at a route, a stop, or a departure time in passenger-web or passenger-mobile sees a
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
- **passenger-web**: a small label chip beside times and on the route header, a "last confirmed" date on
  route detail, and a "What do these labels mean?" dialog.
- **passenger-mobile**: the same chips on search results and route detail, and the explainer as a bottom
  sheet, in each language the app already supports.
- **Tone**: labels inform, never alarm. "Observed · 3 Sep 2026", not a warning icon.

## Acceptance criteria

- [ ] Every departure time a passenger sees carries a label from the table above, and the label matches
      where the time actually came from.
- [ ] A route shows when its data was last confirmed.
- [ ] No passenger surface shows a scheduled or observed time labelled as live.
- [ ] The explainer is reachable from every screen that shows a label, on web and mobile.
- [ ] Both apps show the same label for the same time.
- [ ] Tests named INC-028 cover the label derivation for each row of the table.

## Out of scope

- Crediting individual contributors by name on public pages (a later recognition increment).
- Hiding low-confidence data; confidence decay.
- Stop-level labels in passenger-mobile's live tracking map.

## Constraints

- Depends on INC-027 being merged.
- Published contract change: regenerate the core-service client; passenger-mobile's duplicated client copy
  (known debt) must be updated too, or it shows no labels.
- Passenger query stays auth-free and in one query; the label is derived in that query, not by an extra
  call per row.

## Open questions

- passenger-web has no translation layer. English-only labels there are acceptable for now, but the
  choice should be conscious.

## Decisions

- See ADR-018
