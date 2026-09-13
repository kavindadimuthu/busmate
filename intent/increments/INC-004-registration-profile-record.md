---
id: INC-004
title: Self-registration leaves a usable account
state: in-review
track: 2
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

Someone who registers an account ends up with everything that account is supposed to have, so that
the rest of the product can assume a registered user is a complete user. Today they get a user record
and nothing else, and every feature that reads a profile fails for them.

## Why now

It blocks [INC-005](INC-005-profile-photos-in-the-portal.md). Building photo upload into the portal
while a genuinely new user cannot have a photo at all would ship a feature that works in every demo
and fails for every real signup.

More importantly the cause is unknown, and the shape of it is alarming rather than cosmetic.
`registerPassenger` writes four things — the user, the password credential, the local identity and
the profile — inside one `@Transactional` method that says in its own comment that a failure anywhere
rolls the whole thing back. The user row commits and the profile row does not. Whatever explains
that could equally apply to the credential and identity writes sitting beside it, so the honest first
step is diagnosis, not a patch.

## Acceptance criteria

- [x] The cause is understood and written down before anything is changed. "It works now" is not an
      acceptable outcome if nobody can say what was wrong.
- [x] A newly registered user has every record the registration path claims to create — verified by
      inspecting stored data directly, not by the endpoint returning success.
- [x] The same check covers the privileged user-creation path and the social-identity path, both of
      which build a profile the same way. If they were already fine, that is a finding worth stating.
- [x] A test fails if any one of registration's records goes missing again, and it asserts on what
      was actually persisted rather than on the response. Confirmed by removing the fix and watching
      both tests fail on the right assertion, then restoring it.
- [x] Existing accounts that are already missing a profile are either repaired or deliberately left
      alone, with the choice recorded.

## Out of scope

- Any media or photo work. This increment exists so that INC-005 rests on something solid.
- Redesigning registration, the profile shape, or the account lifecycle.
- The `SupabaseAuthClient` decommission, even though it sits in the same service.

## Constraints

- **Track 2 at A2**: account creation is the auth path, and a defect here is silent — a user appears
  to register successfully and only fails later, somewhere else. Risk is R2 by path, but track is set
  by blast radius, and this affects every account the product will ever have.
- Diagnosis precedes the fix. If the answer turns out to be a persistence subtlety rather than a
  typo, that fact belongs in the commit message, because the next person to write a multi-write
  transaction in this service needs it.
- Repairing existing rows touches stored data — local only, never a shared environment, per
  `always_human`.

## Open questions

- ~~Are the accounts currently missing a profile worth repairing, or is deleting them cleaner?~~
  **Resolved: deleted.** Every affected account was one created while diagnosing this, in a local
  development database. No account with anything behind it was missing a profile.

## Discovered during the work

**The cause is a bulk query that clears the persistence context without flushing it first.**
`OneTimeTokenRepository.invalidateActive` was annotated `@Modifying(clearAutomatically = true)` with
no `flushAutomatically`. Issuing the verification-email token therefore cleared Hibernate's
persistence context and discarded every insert that had been queued but not yet written — which was
the identity and the profile. The user and credential rows survived only because `createCredential`
happens to use `saveAndFlush`, so they had already reached the database. That accident of ordering is
what made the failure look arbitrary rather than systematic, and why the transaction committed
happily with two of its four writes silently gone.

**This was the third time the same trap was hit, and the first two were patched at the call site.**
`CredentialService.updatePassword` and `UserService.updateStatus` both carry comments describing
exactly this behaviour and both work around it locally with `saveAndFlush`. The hazard was understood
and never fixed at its source, so it kept finding new victims. The fix pairs `flushAutomatically`
with `clearAutomatically` on all five bulk queries in the service, which removes the trap rather than
stepping around it. The two existing workarounds are left in place as defence in depth, with their
comments corrected so they no longer describe a live hazard.

**Privileged user creation was affected too, and the social path was not.** `createUser` — the
admin-facing path that provisions operators, conductors and staff — has the same shape and lost the
same two rows; its test fails without the fix exactly as registration's does. Social account
creation never ran a clearing query after saving the profile, so it was always fine.

**Unrelated finding: the development seed creates no identity rows at all.** Every seeded demo
account lacks a `user_identities` row, which is a gap in the seed data rather than a symptom of this
bug — seeded accounts log in because password login reads credentials, not identities. Logged to the
backlog rather than fixed here.

## Decisions

- No ADR. This changes no architecture; it removes a persistence hazard and records why it existed.
