# ADR-028 · An AI reads a pasted timetable post, code checks every value against it, and staff approve it

**Date:** 2026-09-28 · **Status:** Proposed
**Type:** architecture

## Context

Community timetables arrive as social-media posts in no fixed format. [INC-048](../increments/INC-048-import-embilipitiya-post.md)
and [INC-059](../increments/INC-059-import-southern-expressway-section.md) read one real post with a
hand-written parser (`scripts/timetable-post/parse.mjs`). It is exact and auditable, but it recognises only
that post's layout: a post laid out any other way yields nothing until a developer writes a new reader for
it, and each new layout costs that again. Every community page lays its posts out differently.

The loading side is already format-independent: rows go in as reports (`SRC_5`, [ADR-025](ADR-025-staff-may-record-a-report-dated-to-its-source.md)),
dated to the post, with times only in the unverified columns and nothing guessed. Only the reading is the
bottleneck.

An AI model can read a post in any layout. It can also be wrong in ways a parser is not: a digit misread, a
departure dropped without saying so, a day or a class that the post never stated filled in because it looks
likely. Its mistakes are not repeatable the way a parser bug is, so "the first few rows looked right" is no
evidence about the rest.

## Options considered

1. **Keep writing a parser per layout.** Exact, free to run — and a developer's time for every new source.
2. **An AI writes straight into BusMate's records.** Fast, and it puts unreviewed guesses in front of
   passengers, which [ADR-018](ADR-018-community-changes-are-reviewed-changesets.md) rules out.
3. **An AI proposes, code checks, staff approve.** *(chosen)*

## Decision

- **The AI only proposes.** It turns pasted text into rows in BusMate's own shape. Nothing reaches a stop,
  route, schedule or working until a staff member has reviewed and approved the rows.
- **Code, not the AI, decides what is trustworthy.** Before staff see anything, the server checks the answer:
  - every time, plate, operator name and place in a row must appear in the pasted text, or the row is flagged
    as not found in the post;
  - every line of the post that carries a time must be used by a row or skipped by the AI with a stated
    reason, or it is flagged as unaccounted for;
  - an answer that does not fit the expected structure is rejected whole, never shown as a partial table.
  The AI is told to skip what it cannot read rather than guess; the checks exist because an instruction is
  not a guarantee.
- **Place names are matched to stops by code.** Staff confirm each match or choose to create a new stop. The
  AI never picks a stop.
- **Loading follows the existing rules unchanged:** a report dated to the post, times unverified, no
  positions, days only where the post states them, no fares, safe to apply twice.
- **The logic lives in core-service.** The instructions, the checks and the matching are domain rules; the
  gateway only routes. The existing `/api/ai/generate-route` proxy, where the browser writes the instructions,
  is not reused.
- **The provider sits behind an interface; Gemini first.** Gemini is already a dependency and its key already
  lives server-side, so no new third party is added. Tests use a stand-in, never a real model.
- **Staff only** (MOT, ADMIN), enforced by the server.
- **Pasted text only.** The "must appear in the post" check cannot run against an image.
- **Drafts are stored:** the pasted text, the AI's answer, the check results, and — once approved — what
  staff actually loaded, so any mistake can be traced to the AI or to the review.

## Consequences

- **The pasted text, booking phone numbers included, is sent to the AI provider as it is, and stored in the
  draft.** A deliberate, temporary choice made by the owner for the first version. Phone numbers still never
  enter a stop, route, schedule or working: the extracted structure has no place for them. Removing them
  before sending is the first follow-up.
- A new external call on every extraction: a small cost per post, a network dependency, and a key to keep
  server-side.
- One migration, for the drafts table. A production migration is a human step.
- The hand-written parser stays; this is a second way in, not a replacement.

## Revisit when

- Phone numbers are removed before the text leaves BusMate (the first follow-up).
- Images or screenshots of posts are wanted: the grounding check needs a different basis.
- Contributors, not only staff, are to use it — a separate trust decision.
- The provider changes, or measured accuracy against real posts turns out too low to be worth the review.
