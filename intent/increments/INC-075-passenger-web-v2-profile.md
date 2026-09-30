---
id: INC-075
title: Passenger-web v2 — profile
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A signed-in passenger can see who they are on BusMate, change their name, username and phone number, change their
password, and log out, comfortably on a phone.

## Why now

Sign-up asks only for a name, email and password, and promised the username and phone number could be added on the
Profile page ([INC-065](INC-065-passenger-web-v2-auth.md)). The header's account menu and the footer both link to a
profile that led to "not rebuilt yet".

## Acceptance criteria

- [x] The profile page shows the passenger's name, email and, only when true, that the email is verified.
- [x] Name, username and phone number can be changed and saved; only what changed is sent; a saved change shows
      at once everywhere (header, account card).
- [x] Entries are checked before anything is sent, with plain messages: a name of at least two characters, a
      username of 3 to 30 letters, numbers or underscores, a phone number of 7 to 15 digits. Username and phone
      may be left empty by someone who has none.
- [x] A username can be changed but not removed (the server can't clear one); a phone number can be cleared. The
      form says so instead of failing silently.
- [x] Save is available only when the form differs from what is saved, and Undo puts it back.
- [x] A username someone else holds, a server error, rate limiting, a refusal and no connection each say what
      happened in plain words, and the passenger keeps what they typed.
- [x] The password can be changed with the current one; a wrong current password says so and leaves the
      passenger logged in; a new password equal to the current one or under 8 characters is refused up front.
- [x] After a password change the passenger is logged out (the server ends every session) and sent to log in with
      a note and their email filled in; the old password and old session no longer work.
- [x] Log out ends the session and returns home; a signed-out visitor is sent to log in and back.
- [x] On a phone nothing scrolls sideways, every control is at least 40px, and the account card and first field
      are on the first screen.

## Out of scope

- Changing the email address, verifying it, and forgotten or reset password: they wait for email settings.
- A profile photo, loyalty tiers, saved cards, saved routes and notification settings: not backed by BusMate, or
  their own increments.
- Fixing user-service answering a taken username with a bare 500 instead of a 409: found here, left for the owner.

## Constraints

- Uses only the calls the existing app already makes: update user, change password, me, log out.
- No new dependency. The rules and what-changed logic are pure and tested with Node's built-in runner.
- A server 5xx is never shown to the passenger as its own text (this also applies to log in and sign up).

## Decisions

- Left out of the design as having no backing: the loyalty widget, saved payment cards, saved routes and
  notification preferences (loyalty and cards were already dropped by the owner).
