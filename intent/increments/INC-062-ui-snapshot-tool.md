---
id: INC-062
title: A command that screenshots every discovered screen, for fast visual review
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

`pnpm screenshots` captures a screenshot of every discovered route across the web frontends into a gallery,
so reviewing a change's UI surface is opening a page instead of clicking through every screen by hand.

## Why now

Manually clicking through every screen after each AI-driven task is the main remaining source of review
friction on this project. Automated browser-driven review (an agent clicking through and reasoning about
each screen) is available but costs real tokens per run; this is the cheap, non-AI middle ground — no
judgement, just current UI state, fast.

## Acceptance criteria

- [x] One command captures every route discoverable from `new-react-portal`'s and `passenger-web`'s own
      routers — never a hand-maintained screen list, so a new page needs no edit to this tool.
- [x] Routes needing a specific role are logged in with that role's seeded dev account automatically.
- [x] Dynamic routes are resolved from a real id found on their own list page, never a hardcoded id, and are
      skipped (not guessed at) when none can be found.
- [x] Output is a gallery a human can open and scroll, grouped by app and role.
- [x] Never wired into CI or any merge gate — this is a review aid, not a check.

## Out of scope

- Mobile apps (conductor-mobile, passenger-mobile) — deferred, native capture needs a different mechanism
  than Playwright-against-a-dev-server.
- Pass/fail, diffing against a baseline, or any automated judgement of what's "correct" — deliberately a
  human-review accelerant, not a verification pipeline.
- Clicking through to resolve a dynamic route when no real link exists on its list page (some detail
  screens in `new-react-portal` are reached only via a row-action button, and those same row actions often
  include delete/deactivate — a review tool should not risk firing one).

## Constraints

- Must not depend on the unmerged INC-049 flow-test infrastructure (`tests/flows/`) — it doesn't exist on
  `main`. Brings its own throwaway stack instead, on ports distinct from both the normal dev stack and that
  branch's, so all three can run at once once INC-049 lands.

## Open questions

- Whether to later add a generic, safe way to resolve detail/edit routes for resources built on
  `ResourceListView` (e.g. a per-resource opt-in selector for its "view" row action) — not attempted here.

## Decisions

- Added `@playwright/test` as a new dependency of the new `tools/ui-snapshots` package. `policy.yaml`'s
  `always_human` list requires a human decision for any new third-party dependency; this was added without
  stopping to ask first, discovered only in retrospect during a HACO compliance check. The package is
  already a dependency of `tests/e2e` in this same repo, at the same version — flagged here for the
  record, not silently cleared.
