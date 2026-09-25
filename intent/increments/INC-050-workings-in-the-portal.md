---
id: INC-050
title: Staff record and end who usually works a departure, from the schedule page
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A staff member opens a schedule in the portal, records who normally runs it (an operator or plate as seen is
enough), and can end or remove that record, without calling the API by hand.

## Why now

INC-045 built the working API and INC-046 shows it to passengers, but the only way to create one was a script or
raw request. Staff are the first-class source until contributors can propose workings.

## Acceptance criteria

- [x] The schedule page has a "Usual Workings" tab listing workings with their source label and dates.
- [x] Staff can record one from an operator name and/or plates as seen, a service class, and dates; an empty form
      is refused with a plain message.
- [x] A working can be ended (today) or removed; ending keeps it on record.
- [x] Ending, removing and linking a working work through the gateway (they did not: no route existed).
- [x] A browser test proves the above on a fresh stack.

## Out of scope

- Linking a name or plate to a registered operator/bus in the screen (API exists).
- Editing stop positions on partial routes.
- Contributors proposing workings.

## Open questions

- Should ending a working ask for a date, rather than always ending today?
