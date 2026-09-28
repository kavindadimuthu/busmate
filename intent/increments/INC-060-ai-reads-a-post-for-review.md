---
id: INC-060
title: Staff paste a timetable post and see an AI's reading of it, checked against the text
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A staff member pastes a community timetable post in any layout and sees, beside the original text, what an AI
read from it — with every value the AI could not point to in the text, and every timed line it did not
account for, marked. Nothing is loaded yet.

## Why now

Hand-writing a reader per post layout (INC-048, INC-059) does not scale past one source. Before building the
approve-and-load half, the reading has to be shown good enough, on real posts, to be worth reviewing.

## Acceptance criteria

- [x] A staff-only page in the portal (Community → Import a post); the server refuses anyone else.
- [x] The text is read by Gemini through a provider interface in core-service, using the key already held
      server-side; the key never reaches the browser. Tests use a stand-in, never a real model.
- [x] The answer is rows of: time, where from and where to (as written), operator, plates, service class and
      days only if stated, notes, and which lines of the post each row came from; plus lines skipped with a
      reason, and the post's own date if it states one.
- [x] An answer that does not fit that structure is rejected whole, with a plain message.
- [x] Any time, plate, operator or place not found in the pasted text is marked on its row.
- [x] Any line with a time that no row uses and the AI did not skip is marked as unaccounted for.
- [x] The review shows the original text beside the rows, and totals: rows read, rows marked, lines
      unaccounted for.
- [x] The paste, the AI's answer and the check results are saved as a draft that staff can reopen.
- [x] A limit on the length of a paste, and on how often one person can run it.
- [ ] Measured once against the real Embilipitiya post: how far the AI's reading agrees with the hand-written
      parser's, reported as numbers. **Needs the real post pasted again — not done in this pass.**
- [x] Tests: the checks, against invented posts; the endpoint with the stand-in; a browser test of paste and
      review.

## Out of scope

- Editing rows, matching stops, loading anything (INC-061).
- Removing phone numbers before sending (the first follow-up; see ADR-028).
- Images and screenshots.
- Contributors.

## Constraints

- One migration (drafts): R3, reviewed by a named human, run in production only by one.
- Named reviewer: kavinda.

## Decisions
- See ADR-028
