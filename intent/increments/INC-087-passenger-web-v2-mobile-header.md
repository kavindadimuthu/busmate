---
id: INC-087
title: Passenger-web v2 — a roomy mobile header with a menu sheet
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

The header is comfortable to read and use on a phone.

## Why now

On the live site the header was 98px of two cramped rows on every phone: the logo, theme switch and account buttons on top,
and the four pages squeezed into a strip underneath. On a tablet its buttons were 38 to 40px.

## Acceptance criteria

- [x] One 64px bar at every width: the brand, then Log In and Sign Up (or the account avatar), then a menu button below
      1024px. From 1024px the pages sit in the bar as before.
- [x] The menu opens as a sheet from the bottom with every page as a 56px row, the current page marked, Log In and Sign Up
      when signed out, and the theme switch. It closes on choosing a page and on Escape.
- [x] Every header control is at least 44px below 1024px, with nothing off-screen and no sideways scroll, from 320 to 1440.
- [x] Signed in, the menu adds My Tickets and drops Log In and Sign Up, and the account avatar menu still works.
- [x] Light and dark themes both look right.

## Out of scope

- The wording of the landing page hero, which still says "book your seat online" while booking is closed.
