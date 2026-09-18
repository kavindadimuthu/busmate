---
id: INC-015
title: Light/dark theme for passenger-web
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal
Let a passenger choose light, dark, or system theme in passenger-web, applied consistently across
every page, remembered across visits.

## Why now
The full light/dark design-token pair already existed in `index.css` and `tailwind.config.ts`
(`darkMode: ["class"]`, a complete `.dark` palette) but nothing ever applied the `.dark` class or
gave passengers a way to choose - the tokens were dead code. Requested directly, in a scalable,
standard way that survives future pages without another sweep.

## Acceptance criteria
- [x] A passenger can pick Light / Dark / System from a toggle in the navbar (desktop and mobile).
- [x] The choice persists across reloads (localStorage) and across sessions.
- [x] "System" tracks the OS preference live, including while the tab stays open.
- [x] No flash of the wrong theme on first paint.
- [x] Existing pages/components that hardcoded light-only colors (not the reusable token system)
      are corrected to use the existing tokens, so they actually render correctly in dark mode.

## Out of scope
- Per-component design refresh beyond making existing surfaces theme-correct.
- Theming the Leaflet map popup in `RouteMap.tsx` - it's a separate, self-contained widget
  (Leaflet's own stylesheet, not Tailwind) and stays light-only; flagged as a known gap.
- The printed/QR-code box on the ticket detail page stays a fixed white surface deliberately -
  scannability requirements don't follow the site theme.

## Constraints
- Build on the token system that already existed (`--background`, `--foreground`, `--card`,
  `--muted`, `--border`, etc.) - never a second, parallel one.
- New UI must consume the same tokens as everything else, not introduce ad hoc colors, so it stays
  correct as the app grows.

## Decisions
- Light / Dark / System (not a plain two-way toggle): approved by the human owner as the standard
  pattern.
- Toggle sits next to the account menu, visible to logged-out passengers too, not tucked inside it.
