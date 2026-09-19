---
id: INC-031
title: Staff review stop proposals, and an approved one becomes the stop passengers see, credited and reversible
state: shaped
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

- **Review queue** in the portal under "Community → Review", for MOT and admin: filter by status, type,
  district and contributor; oldest first by default.
- **Review page**: current and proposed values side by side with changed fields highlighted; a map with
  both positions and the distance between them; how and when the contributor observed it, and their note;
  a contributor card with status, declared affiliation, and proposals approved and rejected so far.
- **Approve** applies in one transaction: refused if the reviewer is the proposer, refused if the stop
  changed since the proposal was made (the reviewer sees current values and can only reject it as
  outdated), refused if the stop's tier outranks `SRC_4`. In that last case the proposal is kept and
  marked as a correction for the record's owner. Otherwise it writes the stop, stamps provenance
  (`SRC_4`, observed on the contributor's date, credited to them) and keeps the values it replaced.
- **Reject** requires a reason chosen from a short list (duplicate, wrong position, cannot verify, not a
  stop, other) plus optional text; the contributor sees both.
- **Revert** on an applied proposal restores the values it replaced and their provenance, and is itself
  recorded; it is refused if the stop has changed since.
- **passenger-web**: the proposal detail page from INC-030 shows approved, rejected (with reason) or
  reverted.

## Acceptance criteria

- [ ] Staff see pending stop proposals and, for each, what would change, both positions on a map, and the
      contributor's affiliation and record.
- [ ] Approving a proposal changes the stop passengers see, labelled observed and credited to the
      contributor.
- [ ] Nobody can approve their own proposal.
- [ ] A proposal against a stop that changed after it was made cannot be approved.
- [ ] A proposal against an official record is not applied, and stays visible to MOT as a correction.
- [ ] Rejecting requires a reason, and the contributor sees it.
- [ ] Reverting an approval restores the previous stop and provenance, and is refused if the stop has
      changed since.
- [ ] Tests named INC-031 cover each refusal, apply-with-provenance and revert against real Postgres.

## Out of scope

- Steward review (a later increment — this one is staff only).
- Reverting everything a contributor has done at once (with suspension, later).
- Route and timetable proposals, evidence photos, notifications.

## Constraints

- Depends on INC-027, INC-028 and INC-030. **INC-028 must be merged before this goes live anywhere
  passengers can see**, so no approved community data is ever shown unlabelled.
- Writes canonical reference data. Named reviewer required; no data changed on a shared environment by
  an agent.
- Apply and revert go through the same stop write path staff edits use, so validation and cached passenger
  reads stay consistent.

## Open questions

- Should a pilot-period approval need two staff sign-offs? With one reviewer (the owner), that is not
  possible yet; the approver-is-not-author rule is the floor.

## Decisions

- See ADR-018
