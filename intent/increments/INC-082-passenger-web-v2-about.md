---
id: INC-082
title: Passenger-web v2 — About page
state: in-review
track: 0
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

Anyone can read what BusMate is, what they can do with it today, and how far to trust what it shows.

## Why now

The footer and the design reference have had an About slot since the rebuild began; it is static and needed no backend.

## Acceptance criteria

- [x] `/about` is reachable from the footer, on a phone with nothing scrolling sideways and every control at least 40px.
- [x] It says only what BusMate does today: no statistics, milestones, team, photos or "real-time" claims, none of which
      anything backs.
- [x] It explains the trust labels using the same wording as the rest of the app, without "Live" (v2 shows no live positions).
- [x] Its questions open and close, and its links go to Find My Bus, Routes and Contribute.

## Out of scope

- The design's milestones, team and statistics, until there is something true to put there.
- A header link: the header is already full on a phone.
