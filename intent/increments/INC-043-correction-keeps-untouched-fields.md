---
id: INC-043
title: Correcting a stop changes what the correction says and nothing else
state: in-review
track: 1
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A contributor's or steward's correction to a stop can no longer erase what it never mentioned — above all
the stop's Sinhala and Tamil names — and the reviewer sees exactly what approving it would do.

## Why now

Found live in the INC-041/042 end-to-end run: approving a name-only correction emptied `name_sinhala` and
`name_tamil`. It is data loss on every correction ever approved, by staff or a steward alike, and the
steward workspace makes approving easier.

## Acceptance criteria

- [x] Approving a correction that states only some fields leaves every other field of the stop as it was,
      including the Sinhala and Tamil names and the location's translated address and city.
- [x] The stored proposal and the reviewer's diff show those kept values, not blanks.
- [x] A value the correction does state still replaces the stop's.
- [x] A blank value counts as not stated.
- [x] A proposal stored before this fix, carrying nulls, cannot erase anything when approved.
- [x] Renaming a stop while keeping its translations is not refused as a duplicate of itself.
- [x] The correction form loads and shows the stop's Sinhala and Tamil names.
- [x] Tests named INC-043 fail without the fix and pass with it.

## Out of scope

- Clearing a field through a correction. "Left empty" and "clear this" look the same on the wire, so a
  correction cannot blank anything; removing a value is a direct staff edit.
- Pending proposals stored before the fix still *display* blanks in the review diff (approving them is safe).

## Constraints

- Writes canonical reference data: R3, named reviewer.
- One rule serves both proposing and approving (`StopCorrectionMerge`), so they cannot disagree.
