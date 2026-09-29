# ADR-025 · Staff may record a third party's report as a report, dated to when it was made

**Date:** 2026-09-25 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-018](ADR-018-community-changes-are-reviewed-changesets.md) made every network record say where it came
from, and left staff able to record `SRC_1`–`SRC_4` only: `SRC_5` (passenger reports, unverified) was meant to
arrive by other routes. That fits data staff hold themselves. It does not fit a staff member transcribing
someone else's timetable, which is what importing a community post is.

Two things go wrong, both seen in the running system rather than argued:

- **The label overclaims.** The only tier that fits is `SRC_4`, "observed by BusMate or an accepted
  contributor". Nobody at BusMate saw a bus on that route; a stranger compiled the list on Facebook.
- **The date is wrong.** Every staff write is stamped observed *now*. A route MOT created showed in
  passenger-web as "Observed — Confirmed 25 Sept 2026", the day it was typed in. A year-old post would read as
  confirmed today.

## Options considered

1. **Import as `SRC_4`, credited to the post in the label.** No code change. The credit is visible to staff
   only, so a passenger sees "Observed, confirmed today" — the overclaim stands.
2. **Wait for the contributor flow to carry it.** Honest, but it delays real data, and testing the model on
   the real post is the reason for importing first.
3. **Let staff record `SRC_5`, and let any record say what date its information dates from.** *(chosen)*

## Decision

- **Staff may record `SRC_5`.** `SRC_6` (derived from history) stays out of reach: nobody transcribes an
  estimate. `SRC_1` stays MOT only. A staff member recording a report is recording that it *is* a report — the
  tier says less about the record, not more, so this cannot make anything look more trustworthy.
- **A create or edit may state `observedOn`**, the date the information dates from. It may be in the past and
  never in the future. Left out, a record is observed now, as before.
- **An edit does not re-observe a report.** Correcting a typo in an unverified report does not confirm it, so
  a record at `SRC_5` keeps its observation date through an edit that does not state a new one. Records at
  other tiers keep today's behaviour.
- The passenger label follows from the tier and the date, unchanged: *reported*, with the date it dates from.

## Consequences

- **Nothing new is trusted.** The change lets staff say *less*. The trust label, the precedence rules
  (a report never outranks anything above it) and the review flow are untouched.
- **A report can now be entered without a person behind it.** `attributedUserId` stays null, as for any staff
  write; the credit is the label. Who ran an import is in the audit columns (`created_by`).
- **Edits to a report leave its age alone**, so an old report keeps looking old until someone actually
  re-observes it and says so.

## Revisit when

- Staff routinely re-verify imported reports, which would argue for an explicit "verified on" action instead of
  an edit that says so implicitly.
- Reports need a source URL or document, not only a label, so a passenger can follow the claim back.
