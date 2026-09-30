---
id: INC-085
title: Passenger-web v2 — map on route and trip details
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A passenger can see a route, or the part of a route they will ride, on a map, from the route page and the trip page.

## Why now

The old passenger-web draws the route on Google Maps and v2 did not; it was the one screen-level gap in the parity audit
(`docs/ui/passenger-web-v2-cutover-readiness.md`) before cutover.

## Acceptance criteria

- [x] Route details and trip details each offer "Show map". Google's script loads only when it is opened, never on
      page load.
- [x] The route map draws the route's stops in order with the start and end marked; the trip map draws the whole route
      with the passenger's journey, boarding to getting off, bold and the rest light.
- [x] A stop can be tapped to see its name. On a phone one finger scrolls the page and two move the map.
- [x] It says the line joins the stops and isn't the road the bus takes, and says when some stops have no known
      position and are left out.
- [x] With fewer than two known positions, or no map key, there is no map card at all rather than an empty map.
- [x] On a phone nothing scrolls sideways and the page's own controls are at least 40px. (Google's "Keyboard shortcuts"
      and "Terms" links inside the map are Google's and are required by its terms.)

## Out of scope

- Road-following lines. That needs Google's Directions API, which is billed separately and is not enabled for this key;
  a line through the stops is drawn instead and labelled as such.
- Live bus positions.

## Constraints

- No new dependency: the Google Maps library added for INC-080 is reused. The Google key must allow the production
  domain as a referrer before this works there.
