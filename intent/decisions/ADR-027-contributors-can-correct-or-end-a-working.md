# ADR-027 · A contributor can correct or end a working, the same way they correct a stop

**Date:** 2026-09-28 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-026](ADR-026-contributors-propose-who-works-a-departure.md) let a contributor propose a *new* working,
and deliberately left correcting or ending an existing one to staff — "a contributor who thinks one is wrong
proposes the new truth and staff or a steward reconcile", with an explicit note to revisit once contributors
ask for it. [INC-057](../increments/INC-057-link-working-to-registry.md) then found staff themselves have no
way to fix a working's observed name or plate either — only end it, delete it, or link it to the registry.
Both gaps have the same shape as the one [ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)
already solved for a stop: something exists, someone knows it's wrong, and the fix should go through review
before it lands.

## Options considered

1. **Leave it with staff, permanently.** Keeps the model small, but a contributor who spots a stale working —
   the operator changed, the route was dropped — has no way to say so; they can only propose a competing
   `CREATE`, which does not read as a correction to anyone reviewing it.
2. **A standalone "correct a working" flow, separate from the changeset model.** Avoids touching the review
   queue, but builds a second decide/apply/reject path next to the one that already does exactly this for a
   stop.
3. **Extend `SCHEDULE_WORKING` to accept `UPDATE`, target the working itself.** *(chosen)*

## Decision

- **A `SCHEDULE_WORKING` changeset may now be `UPDATE`, targeting the working's own id** — mirroring `STOP`,
  where `CREATE` targets nothing yet and `UPDATE` targets the record. Corridor scope for an `UPDATE` comes
  from the working's own schedule's route group, the same rule `CREATE` already used.
- **What can be corrected is what a contributor can see: the observed operator name, the plates, the service
  class, and an end date.** Never a registered operator or bus — that stays a staff act via
  [INC-057](../increments/INC-057-link-working-to-registry.md)'s linking, unchanged by this.
- **A field left out of the correction stays as it is** — the same "keep what wasn't touched" rule
  [INC-043](../increments/INC-043-correction-keeps-untouched-fields.md) built for a stop, so a contributor
  fixing a plate does not have to re-state the operator to avoid blanking it.
- **Correcting the plates replaces the whole list.** A working's vehicles are "one of these", not a set with
  individual identity a contributor can address one at a time; proposing a rotation is proposing the whole
  rotation, matching how `CREATE` already accepts it.
- **Staff gain the same correction directly** — `PUT /api/schedule-workings/{id}`, staff-only, no review — so
  the capability this approval calls is not one only a changeset can reach, and staff can fix a typo without
  deleting and recreating a working.
- **Stale proposals are refused, not merged**, same as a stop: the working's version at proposal time must
  still match, or the reviewer sees the current values and rejects it as outdated.
- **Ending is a correction that sets the end date**, not a new action or a separate flow: it uses the same
  `end()` staff already had, called by the same approval path, whether the proposal is "the plate was wrong"
  or "it stopped" or both at once.

## Consequences

- The review queue, the corridor rule, staleness, and rejection reasons all extend rather than duplicate.
  `ChangesetReviewService` already branches on entity type for approval; this adds one more branch, not a
  second mechanism.
- A revert is not offered for a working correction, same as for its `CREATE` (ADR-026): staff use the
  correction endpoint directly to put it back if a bad approval needs undoing.
- Two contributors correcting the same working at once now meaningfully collide (the staleness check), where
  before only two `CREATE`s on the same schedule could conflict via the overlap rule.

## Revisit when

- Individual vehicles need their own identity across corrections (e.g. keeping a bus link when only the
  operator name changes) — today a plate correction discards any bus link the replaced vehicle had, same as
  it does for `CREATE`.
