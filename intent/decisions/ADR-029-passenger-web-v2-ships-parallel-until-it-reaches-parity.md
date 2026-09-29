# ADR-029 · Passenger-web v2 ships parallel to the current app until it reaches parity, then replaces it

**Date:** 2026-09-29 · **Status:** Proposed
**Type:** architecture

## Context

The current `passenger-web` app (React + Vite, Radix/shadcn components, TanStack Query) works and covers
real functionality: search, booking with a live seat map, PayHere payment, tickets, profile, and the
contributor/steward workflow (propose stops, propose/correct workings, steward review). Its visual design
was never built against a deliberate design system — it accumulated screen by screen.

The product owner commissioned a modern visual design in Claude Design: 12 pages
(`docs/ui/passenger-web-v2-design-source/`, cataloged in
[docs/ui/passenger-web-v2-design-reference.md](../../docs/ui/passenger-web-v2-design-reference.md)) covering
landing, auth, find-bus/search, route/trip details, booking, payment, profile, routes, about, and a
community/contributor section. The design is a visual and structural reference, not a working app: it has
no real backend behind it, and several of its screens depict capabilities BusMate does not have (a loyalty/
points tier, a contributor leaderboard with badges, saved payment cards, Google sign-in). It is also missing
screens the current app actually needs (My Tickets has no dedicated design page).

Redesigning the current app in place would mean the live passenger-facing app is broken or inconsistent for
the whole span of the rebuild — every screen touched is a regression risk on the one app real passengers use
today, with no working fallback while incomplete.

## Options considered

1. **Redesign `passenger-web` in place, screen by screen.** No duplicate app to maintain, but every commit
   during the rebuild puts a real user-facing app in a partially-migrated state, and rollback means reverting
   commits under time pressure rather than simply not switching over.
2. **Restyle only, keep the current app's structure.** Lower effort, but the current app's structure grew
   organically alongside backend changes; some of the design's layout ideas (search-bar-over-hero, sidebar
   filter with sticky position, seat-grid presentation) don't fit it without deeper rework anyway.
3. **Build a new app in parallel (`passenger-web-v2`), reaching functional parity with the current app before
   cutover, then retire the old one.** *(chosen)* Zero risk to the live app during the entire rebuild; a
   demoable, reviewable increment sequence; an explicit, human-approved cutover step rather than a gradual
   drift.

## Decision

- A new Nx app, `apps/frontend/passenger-web-v2`, is scaffolded on the same stack as the current
  `passenger-web` (Vite, React, the same Radix/shadcn component base, TanStack Query, the same
  `@busmate/api-client-*` libs, the same `api-gateway` integration pattern). Not deployed, not linked from
  anywhere reachable by real users, until it has parity.
- The Claude Design pages are a **visual and pattern reference only**. Design elements with no backing
  capability are not built as part of this rebuild:
  - No loyalty/points/tier system ("Gold Traveller progress").
  - No contributor leaderboard/badges/points — the real contribute/steward workflow (propose stops,
    propose/correct workings, steward review) is restyled instead, using the same visual language.
  - No saved payment methods — PayHere here is redirect-per-transaction; there is nothing to store.
  - No Google/social sign-in — no OAuth integration exists.
- The PayHere payment integration is ported as working logic, not rebuilt; only its surrounding screens are
  restyled.
- Build order: core passenger flows first (landing, auth, find-bus/search, route & trip details, booking,
  payment, tickets, profile), each screen or small group of screens as its own increment. The
  contributor/steward restyle is a later phase, once the core is stable and demoable.
- Cutover (routing the real domain/traffic to `passenger-web-v2` and retiring `passenger-web`) is a distinct,
  later decision — not part of this ADR — made once parity is demonstrated, and goes through this repo's
  Track 2 / `always_human` process for anything touching deploy or routing config.

## Consequences

- Two passenger-web codebases exist side by side for the duration of the rebuild. Bug fixes needed on the
  live app during this period must be applied there directly, not assumed to be "coming in v2" — v2 has no
  users yet.
- No new third-party dependency is intended by this decision beyond what the current `passenger-web` already
  uses; if the v2 build later needs one, that still requires separate human sign-off per this repo's policy.
- The design's fictional capabilities (loyalty, leaderboard, saved cards, social login) are deliberately not
  built. If any of these becomes a real product want, it is a separate feature decision with its own ADR, not
  an implicit side effect of this redesign.
- Extra short-term cost: some UI work (component styling, layout) is done twice in spirit — once conceptually
  in the design, once for real against the actual data — but this is the cost of not risking the live app.

## Revisit when

- Parity is reached and cutover is being planned — that step needs its own review of what "parity" actually
  covers before traffic moves.
- A design element currently dropped (loyalty, leaderboard, saved cards, social login) becomes a real,
  separately-decided feature — it should be designed against real backend capability at that point, not
  retrofitted into this rebuild.
- The parallel-app maintenance cost (bug fixes landing only on the old app) turns out heavier than expected,
  which would argue for a faster cutover schedule or a smaller first phase.
