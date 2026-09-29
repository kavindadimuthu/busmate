---
id: INC-056
title: A passenger can report a problem, without becoming a contributor
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

Any signed-in passenger can say something is wrong with a departure or who runs it; staff see it in a queue,
check the real record with the tools they already have, and mark it resolved.

## Why now

Passengers had no way to say anything back to BusMate short of becoming an active contributor and filing a
full correction — a much heavier bar for "the bus didn't come today". This closes that gap: the structural
one the earlier workflow evaluation named as missing.

## Acceptance criteria

- [x] Any signed-in user may report; it is never gated behind contributor status or the agreement.
- [x] A report is not a changeset: it proposes no replacement values and never touches canonical data by
      itself. Staff decide what to do about it separately, with the tools already built for that.
- [x] A reason that doesn't fit what is being reported is refused (a plate complaint about the whole
      departure, a time complaint about who runs it).
- [x] One open report per person per target; asked again, they're told it's already reported.
- [x] Staff see an open queue and a resolved one, resolve with an optional note, and never see who reported
      it — the same boundary drawn for a changeset's proposer.
- [x] Signed out, the entry point sends a passenger to sign in rather than opening the form.

## Out of scope

- Targeting one specific working among several by id when a departure has more than one — the model
  supports it (`SCHEDULE_WORKING`), but nothing yet lets a passenger name which one; a report about who runs
  it is filed against the departure as a whole until that exists.
- Any automatic effect on confidence or trust. A report is a signal for a human, not an input to the decay
  math built in INC-054 — deliberately, so a report can't be used to tank a record's standing on its own.
- A rate limit beyond the one-open-report guard and the gateway's own general limit.

## Decisions

- Not a changeset, and not folded into the review queue: a report has no proposed values to compare, apply
  or revert, so giving it that machinery would be building for a shape it doesn't have.
