---
id: INC-064
title: Passenger-web v2 — site shell and landing page
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

The first real screen of passenger-web v2: the shared site shell (header, footer, the design's colour and
type tokens) and the landing page, in the Claude Design visual language, showing only what BusMate can
actually back.

## Why now

Every later v2 screen sits inside this shell and uses these tokens, so it goes first
([INC-063](INC-063-passenger-web-v2-roadmap.md) phase 2 order).

## Acceptance criteria

- [x] Header and footer match the design's look in light and dark, and work at phone width (nav collapses
      to a horizontal strip, no page-level horizontal scroll).
- [x] The landing's search bar finds real stops as you type and, on submit, goes to `/findmybus` with the
      same query parameters the current app's search form sends — so the future v2 Find My Bus page can
      read them unchanged.
- [x] The stats band shows real counts fetched from the backend, never fixed numbers.
- [x] The popular-routes section lists real published routes, each linking to its route page.
- [x] Nothing on the page claims a capability passengers don't have today (no live tracking, no ratings,
      no testimonials).
- [x] Links to screens not yet rebuilt in v2 land on an honest "not rebuilt yet" page, not a blank or
      broken one.

## Out of scope

- Auth-aware header (signed-in avatar/menu) — comes with the auth increment.
- The About page, the Find My Bus results page, route pages — their own increments.

## Constraints

- No new third-party dependency. Fonts load from Google Fonts in `index.html`, as the design does.

## Decisions

Made with the owner on 2026-09-29, recorded here because the design shows otherwise:
- Stats band: real counts only. Testimonials: dropped (not real reviews).
- Footer: links only to pages that exist; newsletter box removed (wired to nothing); contact email and
  phone kept, as on the live site.
- Hero: the design's photo, compressed for mobile data.
