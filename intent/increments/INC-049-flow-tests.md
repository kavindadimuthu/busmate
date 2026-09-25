---
id: INC-049
title: The contribution loop and the timetable import run as permanent browser tests
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

One command builds a throwaway stack, drives the community contribution loop and the timetable-post import
through real browsers, and removes the stack, so those flows stop depending on someone clicking through them.

## Why now

INC-041..048 were each verified by hand in a browser. Nothing stops the next change breaking them unnoticed.

## Acceptance criteria

- [x] From nothing, the command starts its own database, services, gateway and both frontends, runs every
      spec, and removes all of it whatever the result.
- [x] It does not use or disturb a dev stack already running (own database, own gateway).
- [x] The specs fail when they should: run again on a stack already used, they fail.
- [x] Authority is checked at the server, not only the screens.

## Out of scope

- CI wiring. It needs Docker, Java and a browser; deciding where that runs is a separate call.
- Media, ticketing, telemetry and mobile flows.

## Constraints

- Test data is invented; real people or plates never go in fixtures.

## Open questions

- Should this run in CI, and on every push or nightly?
