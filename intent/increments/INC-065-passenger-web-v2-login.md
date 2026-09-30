---
id: INC-065
title: Passenger-web v2 — log in, sign up and the signed-in header
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger can create an account, log in and log out in v2, on a phone first, and the header shows who is
signed in. Sessions behave exactly as in the current passenger-web.

## Why now

Booking, tickets and profile all sit behind a login, so nothing after this can be built or checked end to
end without it ([INC-063](INC-063-passenger-web-v2-roadmap.md) phase 2 order).

## Acceptance criteria

- [x] A new passenger can sign up with just their name, email and password, and is told plainly what
      happened, or what was wrong (an email already in use, a password too short, too many attempts).
- [x] A passenger can log in and land where they were headed (or Home), stay signed in across a page reload,
      and log out; a wrong password says so.
- [x] Once signed in, the header replaces Log In / Sign Up with an account menu (name, My Tickets, Profile,
      Contribute, Log out), usable with a thumb at 360px.
- [x] On a 360px phone each form fits without sideways scrolling, fields open the right keyboard and offer the
      browser's saved logins, and every control is at least 40px tall.
- [x] Nothing on either screen promises what BusMate can't do (no fake usage figures, no "keep me signed in"
      switch that does nothing, no Google or phone-code buttons, no links to pages that don't exist).

## Out of scope

- Forgot password, reset password and email verification pages: the backend endpoints exist but no page
  does, in either app. Next increment.
- Google sign-in: deferred until there is a Google client ID and the owner has approved loading Google's
  script ([ADR-029](../decisions/ADR-029-passenger-web-v2-ships-parallel-until-it-reaches-parity.md)).
- Terms of Service and Privacy Policy consent: no such pages or approved wording exist, so no checkbox.
- Moving session tokens from localStorage to httpOnly cookies (below).

## Constraints

- Session handling matches passenger-web: tokens in localStorage, refreshed automatically before they expire.
  Same behaviour, so this rebuild adds no new auth risk and needs no gateway change.
- No new third-party dependency.

## Open questions

- localStorage tokens can be read by any script injected into the page. The staff portals already use
  httpOnly cookies through the gateway. Moving passengers to that is a separate, human-reviewed increment
  because it edits gateway auth code (`always_human`, R3).

## Decisions

Made with the owner on 2026-09-30: recovery pages split into the next increment; Google sign-in left out;
localStorage sessions kept for now; sign-up asks for name, email and password only (the current app also asks
for username, phone and a repeat password). Username and phone are added later on the Profile page.
