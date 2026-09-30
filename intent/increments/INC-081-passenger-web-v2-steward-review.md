---
id: INC-081
title: Passenger-web v2 — steward review of proposals
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A steward can, on a phone, see the proposals waiting on their corridors, judge each against what is recorded now, and
approve it or reject it with a reason the contributor will read.

## Why now

[INC-080](INC-080-passenger-web-v2-propose.md) lets contributors send proposals; without this nothing they send can
be decided from v2, and the Account area's Review tab has been waiting since [INC-077](INC-077-passenger-web-v2-account-hub.md).

## Acceptance criteria

- [x] Only an active steward sees the Review tab and the queue; a passenger or contributor who opens the address is
      told reviewing is for stewards.
- [x] The queue lists what is waiting on their corridors, oldest first, with kind, how long ago it was sent and, for a
      stop correction, how far it moves the position; it filters by waiting, approved or not approved and by stops or
      buses, and marks a proposal that is out of date.
- [x] The proposer is never shown; their own proposals are not in the queue.
- [x] A proposal opens to what it says against what is recorded now (old value struck through, position distance and
      map links for a stop, the departure and who is already recorded on it for a bus), how the contributor knows, and
      the contributor's record and any declared link to buses.
- [x] Approve asks for confirmation and says what it will do; Reject needs a reason that fits the kind (a bus can't be
      rejected as "not a real stop") and a note when the reason is "Other".
- [x] An out-of-date proposal, or a stop held by a more trusted source, closes Approve and says why; Reject stays open.
- [x] A real rejection and a real approval reach core-service; the contributor then sees "Not approved" with the
      steward's reason on their proposal.
- [x] A server refusal is shown in its own words, a server fault in plain ones, and nothing internal ever shows.
- [x] On a phone nothing scrolls sideways, controls on these screens are at least 40px, and the decision buttons stay at
      the bottom of the screen.

## Out of scope

- Undoing an approval: core-service allows it for staff only, so it stays in the management portal.
- Filtering by contributor or district: stewards can't see who proposed.
- Notifying the contributor: they see the decision in Contributions.

## Constraints

- No new dependency. Reasons, blocking rules and wording are pure and tested with Node's built-in runner.
- core-service decides scope, self-review, staleness and precedence; the screens only say it first.
