---
id: INC-055
title: A departure honestly says when nobody has stated which days it runs
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A passenger looking at one departure is told "Days not stated" when no calendar was ever recorded for it,
"Yes" or "No" only when that is actually known for the date they asked about — never a claim nobody made.

## Why now

Closing this was the last item labelled honestly everywhere except the one screen that mattered most: a
departure's own details page. `ScheduleDetails.isActiveOnDate` had been declared since the passenger detail
API was built and never set, so the frontend's fallback read every missing value as "yes". A schedule whose
calendar said "except Sunday" would still show "Operating on Sunday: Yes".

## Acceptance criteria

- [x] A shared, pure evaluator decides whether a schedule runs on a date from its calendar rows, its
      exceptions and its effective period — one answer, used wherever the question is asked.
- [x] No calendar recorded at all reads as "Days not stated", not "Yes" — this was INC-053's page-level
      patch; it is now what the backend actually asserts, everywhere the value is used.
- [x] A calendar rule is honoured for the date it actually is: a schedule that excludes Sunday reads "No"
      on a Sunday. This did not previously hold on the details page.
- [x] A dated exception overrides the weekly pattern either way (an added extra service, a cancelled one).
- [x] Outside a schedule's effective period, it does not run, regardless of what the calendar says.
- [x] The operating-days summary line ("Except Sunday", "Weekdays only", "Every day") is real, not silently
      unset.
- [x] Unit tests cover the evaluator; a browser test proves the previously-wrong case now reads correctly.

## Out of scope

- Trip generation ignoring the calendar entirely (a separate, already-noted backlog item — this increment
  only touches what a passenger is told, not what trips get created).
- A first-class "calendar completeness" marker stored on the schedule, matching `timingCompleteness`'s
  pattern; the evaluator's `UNKNOWN` result already gives the same answer without one.

## Decisions

- The evaluator lives outside any entity or DTO package, taking plain value types, so search filtering and
  the details page can share it without a dependency either way.
