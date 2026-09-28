---
id: INC-058
title: A contributor can correct or end a working; staff can too, directly
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A contributor who sees that a recorded working is wrong or has stopped can say so, through the same review
their other proposals go through; staff gain the matching direct capability, which did not exist before.

## Why now

ADR-026 named this as the next design needed once contributors ask for it, and INC-057 found staff had no
way to fix a working's observed fields directly either — only end it, delete it, or link it to the registry.

## Acceptance criteria

- [ ] Staff can correct a working's observed operator, plates, service class and end date directly, keeping
      whatever a request doesn't mention.
- [ ] A contributor can propose the same correction against an existing working; approval applies it through
      the same staff capability.
- [ ] Corridor scope for a correction comes from the working's own schedule's route group.
- [ ] A correction proposed against a working that has since changed is refused as outdated, not merged.
- [ ] A contributor cannot set a registered operator or bus through a correction — only staff, via INC-057's
      linking, unchanged by this.
- [ ] The reviewer sees what would change, before and after, the same way a stop correction shows it.
- [ ] A contributor can propose ending a working from the departure's own page; staff can too, from the
      schedule page, without deleting and recreating it.
- [ ] Tests: backend integration coverage; a browser test proves the full loop for at least one correction
      and one ending.

## Out of scope

- Un-linking a registered operator or bus (INC-057 didn't build linking's reverse either).
- Keeping a vehicle's bus link across a plate correction — a plate correction replaces the whole list.
- Reverting an approved working correction (matches ADR-026: staff use the correction endpoint directly).

## Decisions
- See ADR-027
