---
id: INC-063
title: Passenger-web v2 — parallel rebuild roadmap
state: done
track: 2
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

Stand up a new passenger-web app, styled from the Claude Design reference
([docs/ui/passenger-web-v2-design-reference.md](../../docs/ui/passenger-web-v2-design-reference.md)) and
functionally grounded in what the current `passenger-web` app actually does, running in parallel until it
reaches parity — at which point the current app is retired. See
[ADR-029](../decisions/ADR-029-passenger-web-v2-ships-parallel-until-it-reaches-parity.md) for the decision
and the reconciliation between the design and real backend capability.

This increment is the roadmap itself: scaffolding the new app and sequencing the work. It does not include
porting any screen — each screen or small group of screens becomes its own increment as work on it starts,
per this repo's rule against speculative intent files.

## Why now

The current app's UI predates any deliberate design system and accumulated screen by screen. The product
owner has a concrete visual direction now (the Claude Design pages) and wants it adopted without risking the
live passenger-facing app mid-rebuild.

## Acceptance criteria

- [x] `apps/frontend/passenger-web-v2` exists as its own Nx app: same stack as `passenger-web` (Vite, React,
      the existing `@busmate/ui`/Radix component base, TanStack Query, `@busmate/api-client-*` libs), runs
      locally on its own port, not linked from any deployed surface.
- [x] The app boots to an empty/placeholder shell that talks to the real `api-gateway` (no mock data) —
      proves the wiring works before any screen is built.
- [x] The phased screen sequence below is agreed and each phase's first increment can be created without
      re-deciding scope.

## Planned phases (for context — not a commitment to create these files yet)

1. **Scaffold** — new app, shared design tokens/component base, gateway wiring. (this increment)
2. **Core passenger flows** — landing, auth (log in/sign up; password recovery pages next; Google sign-in later), find-bus/search with filters,
   route & trip details, booking (seat selection + passenger details, real seat-map logic restyled),
   payment (PayHere integration reused, shell restyled), tickets (My Tickets — no design reference exists,
   needs its own pass), profile (personal info, trips, security — no loyalty widget, no saved-cards list).
3. **Contribute/steward restyle** — propose stop, propose working, propose working correction, my
   contributions, contribution detail, steward queue, steward review. Uses the same visual language as the
   design's Community/Contributor pages, not their leaderboard/points concept.
4. **Cutover** — separate future decision once parity is demonstrated; touches deploy/routing and needs its
   own human sign-off per policy. Out of scope here.

## Out of scope

- Any loyalty/points/tier system, contributor leaderboard/badges, or saved payment methods. Google sign-in is deferred until a client ID exists —
  see ADR-029. Not being built as a side effect of this redesign.
- Reworking the PayHere payment integration logic itself (shell restyle only).
- The actual cutover/retirement of the current `passenger-web` app.

## Constraints

- No frontend CI gate exists yet (`intent/policy.yaml`), so this whole area is capped at autonomy A2
  regardless of how mechanical a given screen-port looks — a human reviews each increment.
- Each screen-porting increment must stay small enough to review in under an hour; group only closely related
  screens (e.g. seat-selection + passenger-details) into one increment.

## Open questions

- What "parity" concretely means at cutover time (does every current screen need a v2 equivalent, or can some
  be deliberately dropped) — deferred to the cutover decision, not this roadmap.

## Decisions

- See [ADR-029](../decisions/ADR-029-passenger-web-v2-ships-parallel-until-it-reaches-parity.md).
