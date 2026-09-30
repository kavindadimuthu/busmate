---
id: INC-078
title: Applying to contribute without a verified email, locally only
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A freshly signed-up passenger can apply to contribute on a local stack, so the contributor flow can be tested by
hand before outgoing email exists, without that ever being possible in production.

## Why now

Applying needs a verified email and an active account; new accounts can only get there through email, which isn't
set up. The owner asked to relax it for testing, as a setting rather than a removal
([ADR-033](../decisions/ADR-033-applying-to-contribute-may-skip-email-verification-locally-never-in-production.md)).

## Acceptance criteria

- [x] By default an applicant still needs an active account with a verified email; the existing application tests
      pass unchanged.
- [x] With the setting relaxed (the dev profile), a `pending` passenger with an unverified email is told they can
      apply, applies, and staff can accept them into an active contributor.
- [x] Relaxed or not, a suspended, deactivated, missing or staff account is refused.
- [x] Production refuses to start with the setting relaxed; a relaxed service logs a warning at startup.
- [x] No change to any response shape or client.

## Out of scope

- Setting up outgoing email and the verification pages.
- A production guard for the draft-agreement override: noted in ADR-033 for the owner.
- Any passenger-app change: the app already reads `canApply` from the server.

## Constraints

- Track 2: it relaxes a security control (on the always-human list), by the owner's decision of 2026-10-01. The
  owner reviews every line before merge.

## Decisions

- See ADR-033
