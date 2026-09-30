---
id: INC-080
title: Passenger-web v2 — propose a stop, who runs a bus, and corrections
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

An active contributor can, on a phone, propose a new stop or a correction to one (with a Google map for its position),
say who usually runs a departure, and correct or end that; then follow the proposal in Contributions.

## Why now

[INC-079](INC-079-passenger-web-v2-contributions.md) built the standing and the list of proposals but left "Propose a
stop" out until this existed. Steward review is the next increment.

## Acceptance criteria

- [x] Only an active contributor sees the forms; everyone else (passenger, applicant, agreement due, suspended,
      declined, staff, signed out) is told why in words. core-service still decides.
- [x] Proposing a stop asks for a name and position by "Use my location" (with its accuracy, warning on a loose fix),
      typed latitude and longitude, or tapping a Google map; it says when a position is swapped or outside Sri Lanka.
- [x] A near-identical existing stop is offered for correction instead, and the contributor can check or send anyway.
- [x] A correction to a stop is prefilled, tags what changed, and refuses to send when nothing did.
- [x] Who runs a departure takes the operator as written, plates (repeats dropped, at most 10), service class, day and
      how they know; a correction can say it has stopped, with its last day.
- [x] A real proposal of each kind reaches the server as pending and appears in Contributions, with a thank-you.
- [x] A server refusal (already pending, daily cap, failure) is shown in plain words and keeps what was typed.
- [x] On a phone nothing scrolls sideways, controls are at least 40px, the first field and the Send button are on the
      first screen at 360x740.

## Out of scope

- The steward's review queue and screens (INC-081).
- Proposing a route, a schedule or a fare.

## Constraints

- New third-party dependencies (owner-approved): `@react-google-maps/api` and dev `@types/google.maps`. The Google
  script loads only on the propose-a-stop page; the key is `VITE_GOOGLE_MAPS_API_KEY`, kept in the git-ignored
  `.env.local`. Without a key the map is left out and typed coordinates still work.
- Validation and request building are pure and tested with Node's built-in runner.

## Open questions

- The key must allow the referrer `localhost:4001` (and later the real domain) in Google Cloud.
