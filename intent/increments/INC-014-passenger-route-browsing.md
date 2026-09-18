---
id: INC-014
title: Public route browsing for passenger-web
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal
Let a passenger browse all published routes and see a route's full stop list, without needing an
origin/destination search or a login — same discoverability tier as FindMyBus search.

## Why now
Both `RouteController` and `StopController` GET endpoints already exist in core-service and are
already publicly permitted there. passenger-web never surfaced them, so passengers who know a route
by name but not their exact stop, or who just want to explore, have no way to do that today.

## Acceptance criteria
- [x] A passenger can open a "Routes" page from the top-level nav and see every published route,
      without being logged in.
- [x] Selecting a route shows its full ordered stop list.
- [x] `GET /api/routes` and `GET /api/stops` are reachable through the gateway without a token; every
      other method on those prefixes still requires one.
- [x] core-service's own `@PreAuthorize` checks on writes to routes/stops are unchanged.

## Out of scope
- Editing routes or stops from passenger-web (admin/MOT surfaces already own that).
- Prefilling the FindMyBus search form from a browsed route.

## Constraints
- The gateway route table (`apps/backend/api-gateway/src/config/routes.config.ts`) currently gates
  by path prefix only, not method — `/api/routes` and `/api/stops` are `requiresAuth: true` as a
  whole today. Opening only the GET verb (not POST/PUT/DELETE) is a deliberate, human-approved
  relaxation of that gate, not a blanket one.

## Decisions
- Public (not login-gated): approved by the human owner over a login-gated alternative that would
  have needed no gateway change.
- Surfaced as a top-level nav link, not a secondary link off FindMyBus.
