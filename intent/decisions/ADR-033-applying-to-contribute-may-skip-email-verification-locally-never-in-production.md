# ADR-033 · Applying to contribute may skip email verification locally, never in production

**Date:** 2026-10-01 · **Status:** Proposed
**Type:** architecture

## Context

To apply to contribute, a passenger needs an active account with a verified email (INC-029). New sign-ups are
`pending` and unverified until they follow the link in a verification email, and outgoing email isn't set up yet.
So today no new person can apply, and the contributor flow can't be walked by hand from sign-up onwards. Seeded
accounts already verified cover the screens, but not the flow a real newcomer takes.

## Options considered

1. **Remove the check until email works.** Simplest, and the likeliest to reach production unnoticed.
2. **Mark test accounts verified in the database by hand.** No code change, but every tester has to know how, and
   it only proves the flow for accounts someone fixed up.
3. **A setting that lifts the check, off by default, on in the dev profile, refused in production.** *(chosen)*

## Decision

`community.applications.require-verified-account` (env `COMMUNITY_REQUIRE_VERIFIED_ACCOUNT`) defaults to **true**.
The dev profile sets it to false. Relaxed, it lifts exactly two conditions: an unverified email, and an account still
`pending` because it was never verified. A suspended or deactivated account, a staff account and an account
user-service can't find are refused either way.

In the `prod` profile core-service **refuses to start** with it relaxed, and it logs a warning at startup whenever it
is relaxed. Tests keep the strict default except the one that proves the relaxed path.

## Consequences

- The contributor flow can be walked from a fresh sign-up locally.
- Accepting and suspending contributors is unchanged; staff still decide.
- When outgoing email works, nothing needs removing: production was never relaxed, and the dev default can be
  turned back on to test the real verification path.
- The draft-agreement override (`community.agreement.allow-draft-acceptance`, INC-029) has no such production guard.
  Not changed here; noted for the owner.
