---
id: INC-046
title: A passenger sees who usually works a departure, labelled as reported
state: active
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

When a passenger searches for a bus, or opens one, they see who usually works that departure — the operator
and plate as people have reported them — worded as a pattern and labelled with where it came from.

## Why now

[INC-045](INC-045-schedule-working.md) can record it; nothing shows it. The Embilipitiya post's most useful
content is exactly this, and a passenger choosing between two 06:00 departures needs it.

## Acceptance criteria

- [x] A search result and the details page carry who usually works a departure on the date searched, read
      without logging in.
- [x] Only a working in effect on that date is shown.
- [x] A rotation shows all its plates; two operators show as two entries.
- [x] A linked operator and bus show their registered names; an unlinked one shows what was seen.
- [x] Each carries where the claim came from, and no id or identity of whoever contributed it.
- [x] A search does not add a query per bus.
- [ ] passenger-web shows it on the result card and on the details page, worded "usually", with a trust chip.
- [ ] A departure nobody has recorded looks exactly as it did before.
- [x] Tests named INC-046 cover the API.

## Out of scope

- Staff screens to record or link workings (an API only, so far), and importing them in bulk (INC-047).
- The mobile apps. Showing "usually" anywhere a trip's own bus is shown: a working is never presented as
  today's bus.

## Constraints

- Nothing here reads or writes a trip: it is display-only (ADR-024).
- The passenger response is public, so it carries display credit only, like every public network record.

## Decisions

- See ADR-024
