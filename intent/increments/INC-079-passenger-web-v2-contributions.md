---
id: INC-079
title: Passenger-web v2 — contribute: programme, apply and my contributions
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger can learn what contributing is, apply, follow their application, and see everything they have proposed
and what reviewers decided, all on a phone, in the account area's new Contributions tab.

## Why now

The account area ([INC-077](INC-077-passenger-web-v2-account-hub.md)) has a Contributions tab waiting for its screens,
and a fresh sign-up can now apply locally ([INC-078](INC-078-apply-without-verified-email-locally.md)), so the whole
path can be walked by hand. First of three contribute increments; proposing a stop or a bus's operator and the
steward's review are next.

## Acceptance criteria

- [x] `/contribute` explains the programme to anyone, signed in or not, with its main button on the first screen of a
      phone: log in first when signed out, the form when they can apply, their contributions when already involved,
      and why not when they can't. It makes no claim about points, badges or rankings.
- [x] The application asks why, home district, the corridors they know (real ones), any link to a bus operator (with
      the detail required when there is one) and acceptance of the agreement as the server has it, saying when it is a
      draft; it checks every entry before sending and keeps what was typed after a failure.
- [x] A real application from a fresh sign-up is accepted, lands on Contributions with a confirmation and "under
      review", and shows the Contributions tab; opening the form again sends them there instead.
- [x] Contributions states each standing in words: under review with the date, contributor, steward with the corridors
      reviewed, suspended or not accepted with the reason given, and a contributor whose agreement changed can read and
      accept the new one there (passenger-web has no screen for that).
- [x] It lists every proposal with its kind, date and status, filters by status with counts, and says when only the
      latest 50 of more are shown.
- [x] A proposal opens to what was proposed (a correction shows only what it changes, old value struck through), how the
      contributor knows, the reviewer's note, and, while under review, can be withdrawn after a confirmation.
- [x] A failed load, an unknown proposal and every failed action say what happened in plain words and never show a
      server's internal text.
- [x] On a phone nothing scrolls sideways, and every control is at least 40px.

## Out of scope

- Proposing a stop, who runs a bus, or a correction: the next increment, with the Google map for a stop's position.
  "Propose a stop" is offered only once that exists.
- The steward's review queue and screens: a later increment; a steward's Review tab appears then.
- A single-proposal read in the backend: the detail page finds its proposal among the latest 100.

## Constraints

- No new dependency. Labels, filters, differences, the apply gate and the form rules are pure and tested with Node's
  built-in runner.
- core-service decides who may apply, propose and review; the screens only follow what its standing call says.

## Decisions

- The position of a stop links to Google Maps as an ordinary link, needing no script or key; the picker that does
  need them belongs to the propose-a-stop increment.
