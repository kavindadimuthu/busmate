---
id: INC-077
title: Passenger-web v2 — account area with role-aware tabs
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A signed-in passenger has one Account area whose menu shows what they have: Profile and Tickets for everyone, and
Contributions and Review when their contributor standing gives them those, with their standing stated plainly.

## Why now

Profile, tickets and contributing were separate pages reached from the header. The contribute screens are next, and
they need a home that changes with the person's standing (passenger, applicant, contributor, steward). Agreed with
the owner: name the area "Account"; offer "become a contributor" as a card, not a tab.

## Acceptance criteria

- [x] Profile and Tickets open inside one Account area, at the addresses they already had (`/profile`, `/tickets`),
      with the current tab marked; a strip on a phone, a column on a desktop.
- [x] The profile's account card states the passenger's standing from core-service: Passenger, Contributor
      application under review, Contributor, Steward with the corridors they review, access suspended (with the
      reason given), application not accepted, or agreement to accept again. Staff accounts get no line.
- [x] A Contributions tab appears for anyone with a contributor standing and a Review tab only for an active
      steward, each only once its screens exist; until then no role gets a tab for a page that isn't there.
- [x] A passenger who could apply gets a "Become a contributor" card, and one who can't yet because their email
      isn't verified is told so, once the programme page exists.
- [x] If the standing is slow or can't be had, Profile and Tickets work at once and nothing claims a role.
- [x] Header menu and footer say "Account".
- [x] On a phone every tab fits without scrolling the strip (four tabs at 320px), nothing scrolls sideways, every
      control is at least 40px, and the tabs and account card are on the first screen.

## Out of scope

- The contribute and steward screens themselves: their own increments, each switching on its own tab.
- Who may contribute or review: core-service decides on every request; the tabs are a courtesy.

## Constraints

- No new dependency. Role and tab logic is pure and tested with Node's built-in runner.
- One standing call, keyed to the signed-in user, so switching accounts can't show someone else's standing.

## Decisions

- Area named "Account"; "Become a contributor" is a card on Profile, not a tab (owner, 2026-10-01).
