---
id: INC-084
title: Passenger-web v2 — parity audit and merge plan
state: in-review
track: 0
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

Say plainly whether v2 is ready to replace the old passenger-web, and in what order the unmerged work should reach `main`.

## Acceptance criteria

- [x] Every route of the old app is compared with v2 and each gap is named, with what decides it.
- [x] The merge order, what each pull request contains and what a reviewer should read first are written down.
- [x] The whole stack's backend and gateway tests were run together.
- [x] v2's 404 page no longer claims a built page is "coming to v2".

## Out of scope

- Opening the pull requests or merging anything.
- The cutover itself (ADR-029).
