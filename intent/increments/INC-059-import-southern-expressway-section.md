---
id: INC-059
title: Read the Southern Expressway section of the Embilipitiya post
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

The Southern Expressway section of the Embilipitiya community post — buses from Embilipitiya via the
Baravakumbuka interchange, and their return legs — is read into BusMate the same honest way INC-048 read
the old-road and new-road sections, with no change to the backend at all.

## Why now

It was the highest-value section INC-048 left unread, and the next piece of the real post the community
gave BusMate. Route 69 and the other long-distance sections are further sections with genuinely different
shapes (two operators sharing one departure, a different note style) and stay unread, on purpose, for a
later increment each.

## Acceptance criteria

- [x] A departure whose destination differs line by line (the "from Embilipitiya" list) is read as two
      lines — a destination, then who runs it — with no fixed route for the whole section.
- [x] The return legs (from Makumbura, Kadawatha, Kaduwela, Karapitiya) are read as an ordinary one-line
      list, the same shape INC-048 already reads, with a plate no longer required — the post gives one far
      less often on this corridor, and "the operator, no vehicle named" is a valid claim (ADR-024), not a
      parsing failure.
- [x] A route ends at the first place a destination names; anything the post hyphens on after that is kept
      as a note in the post's own words, not modelled as a further stop — the same rule INC-048 used for
      through-running.
- [x] The "from Colombo" return list is deliberately not read: every vehicle in it already appears under its
      Kaduwela or Makumbura leg, and reading it too would record the same bus twice under two names.
- [x] New stops (Makumbura, Kaduwela, Kadawatha, Karapitiya) carry no position: the post gives none.
- [x] Checked against the real post: every line in scope parsed with zero problems on the first run.
- [x] Tests: the parser, on invented data; a browser test proves the whole loop — parse, load, search, open,
      and that loading twice changes nothing.

## Out of scope

- Route 69 and the other long-distance/regional sections: a genuinely different shape (two operators sharing
  one departure via "&", heavy return-time annotation) — each its own follow-up.
- "Other cities via the new road" (no route number, each departure effectively its own small feeder route):
  deferred, same as INC-048 left it.
- The fare tables throughout the post: no fare concept exists in BusMate's schema.

## Decisions

- No backend or frontend change. `import.mjs` was already generic over whatever the parser produces;
  extending it was entirely a `scripts/timetable-post/parse.mjs` change.
