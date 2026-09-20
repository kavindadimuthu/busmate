---
id: INC-031
title: Staff review stop proposals, and an approved one becomes the stop passengers see, credited and reversible
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Staff open a review queue in the portal, compare each stop proposal with the current stop — field by field
and on a map — and approve or reject it with a reason. An approved proposal changes the canonical stop,
labelled observed and credited to its contributor. A wrong approval can be undone. The contributor sees
the decision.

## Why now

This closes the first full loop of the programme: enthusiast → proposal → review → the network passengers
see. It is what the ADR-017 pilot needs to start, and it is where the precedence, approver-is-not-author,
stale-proposal and revert rules of [ADR-018](../decisions/ADR-018-community-changes-are-reviewed-changesets.md)
become real.

## Design

- **A second migration (V010)** adds what apply/revert need beyond INC-030's changeset: `applied_version`
  (the stop's version right after an approval writes it, so revert can detect a further change), and
  `previous_*` columns capturing the target's exact prior provenance — including who was credited, read
  from the entity directly rather than the public API — plus `reverted_by`/`reverted_at`. `REVERTED`
  joins the status enum.
- **Review queue** (`/mot/community/review`) and one proposal's review detail, MOT-only, filterable by
  status, proposer and (via each contributor's declared district) home district; oldest first.
- **Review page**: a field-by-field diff table, changed cells highlighted, plus a two-pin map (current
  and proposed) with the distance between them; how and when the contributor observed it and their note;
  a contributor card with declared affiliation and approved/rejected counts.
- **Approve** goes through the same mapper and duplicate-name check staff stop edits use. Refused if the
  reviewer is the proposer, if the stop changed since the proposal (version check — the UI shows an
  "Outdated" flag and disables Approve), or if the stop's tier already outranks `SRC_4` (the UI shows an
  "Outranked" flag and explanation; the proposal stays pending as a correction for staff to act on
  directly). Otherwise it writes the stop, credits the contributor (`SRC_4`, `attributedUserId` set,
  observed on the date they gave — labelled `"Community contributor"`, never the real name, matching the
  boundary INC-028 drew for the same public endpoint) and snapshots the prior provenance for revert.
- **Reject** requires a reason from a short list (duplicate, wrong position, cannot verify, not a stop,
  other) plus optional text, combined into the reason the contributor sees.
- **Revert** restores the stop's values at proposal time and its exact prior provenance (not a guess);
  refused if the stop changed again since the approval, or if the changeset was a new stop (not
  supported — deleting a wrongly-approved new stop is a direct staff action, not a revert).
- **passenger-web**: the proposal detail and list pages (INC-030) now handle `REVERTED` alongside
  approved, rejected (with reason) and withdrawn.

## Acceptance criteria

- [x] Staff see pending stop proposals and, for each, what would change, both positions on a map, and the
      contributor's affiliation and record.
- [x] Approving a proposal changes the stop passengers see, labelled observed and credited to the
      contributor.
- [x] Nobody can approve their own proposal.
- [x] A proposal against a stop that changed after it was made cannot be approved.
- [x] A proposal against an official record is not applied, and stays visible to MOT as a correction.
- [x] Rejecting requires a reason, and the contributor sees it.
- [x] Reverting an approval restores the previous stop and provenance, and is refused if the stop has
      changed since.
- [x] Tests named INC-031 cover each refusal, apply-with-provenance and revert against real Postgres.

## Out of scope

- Steward review (a later increment — this one is staff only).
- Reverting everything a contributor has done at once (with suspension, later).
- Route and timetable proposals, evidence photos, notifications.

## Constraints

- Depends on INC-027, INC-028 and INC-030 — all built on this same branch stack, so live in order here.
  Not yet merged to `main` (the owner's standing decision for this whole stack).
- Writes canonical reference data. Named reviewer required; no data changed on a shared environment by
  an agent.
- Apply and revert go through the same stop write path staff edits use, so validation and cached passenger
  reads stay consistent.
- The credited identity (`attributedUserId`) is never returned by the public stop endpoints — only the
  generic label "Community contributor" is. The real identity is visible to staff only, via the
  changeset's `proposerUserId` (resolved to a name/email in the portal, same as INC-029's pattern).

## Open questions

- Should a pilot-period approval need two staff sign-offs? With one reviewer (the owner), that is not
  possible yet; the approver-is-not-author rule is the floor.
- Reverting a wrongly-approved *new* stop isn't built — today that means deleting the stop directly
  through the ordinary Bus Stops screen. Worth a small follow-up if it comes up in the pilot.

## Decisions

- See ADR-018
- Live-verified end to end 2026-09-20 against real Postgres and the real running apps: a contributor
  proposed a new stop and a correction; MOT approved the new stop (checked its provenance in the
  database — `SRC_4`, `"Community contributor"`, `attributedUserId` set to the contributor); MOT
  rejected the correction with a reason, confirmed visible to the contributor; a second correction was
  approved then reverted, and the database confirmed the stop's name and provenance were restored
  exactly, including clearing `attributedUserId`. The map (current vs. proposed pin, distance) rendered
  correctly in the portal.
