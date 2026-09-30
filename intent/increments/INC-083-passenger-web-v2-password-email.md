---
id: INC-083
title: Passenger-web v2 — forgot password, reset password and verify email
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger who forgot their password can get a link by email and choose a new one, and a new passenger can confirm
their email address by opening the link sent to them, all on a phone.

## Why now

The SMTP provider is configured (a Mailtrap sandbox in dev), and user-service already sends both emails and has the
endpoints; no app had the pages the links open.

## Acceptance criteria

- [x] Log in has a "Forgot password?" link to a page that asks for an email address and answers the same whether or
      not an account exists, and sends nothing for an unknown address.
- [x] The reset link opens a page to choose a new password (at least 8 characters, Show switch); success sends the
      passenger to Log in with a notice, the old password stops working and the new one works.
- [x] A reset link that is missing, used or expired says so and offers a new one, and never shows server internals.
- [x] The verify link confirms the email once when opened, signed in or out, and a repeat visit says the link was used
      rather than reporting a good link as bad (no double run).
- [x] After verifying, the account can apply to contribute.
- [x] A real email reaches the provider, and the links in real emails point at these pages.
- [x] On a phone nothing scrolls sideways and every control is at least 40px.

## Out of scope

- Asking for a new verification email: user-service has no endpoint for it (a link lasts 24 hours). Shaped separately
  if wanted; it touches authentication, so it is Track 2.
- Branded HTML emails: the emails are plain text today.
- Restoring the strict "verified email to apply" rule in dev (INC-078): a separate decision.

## Constraints

- No new dependency, no backend change. Only the sandbox provider was used; nothing was sent to a real inbox.
- The password rule is the same as sign-up's, because the server checks nothing.
