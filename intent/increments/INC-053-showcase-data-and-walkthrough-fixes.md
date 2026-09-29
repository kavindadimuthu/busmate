---
id: INC-053
title: Showcase data for every community flow, and what a click-through of them found
state: in-review
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

Every community flow can be looked at in a dev database without entering data by hand, and the screens for
INC-041..052 have been used by clicking, not only tested through the API.

## Why now

The stack of INC-041..052 was verified mostly through the API and targeted browser tests. Walking the screens
against realistic data found problems no API test could.

## Acceptance criteria

- [x] One repeatable command seeds proposals in every state, workings (current, ended, proposed, approved) and
      the imported timetable, through the real APIs. Running it twice changes nothing.
- [x] A browser test runs the seed and checks the screens show those states.
- [x] An imported route with no group can be opened in the portal and have a stop added.
- [x] An unknown distance reads "distance not known", never "0.0 km from start".
- [x] A departure with no stated days reads "Days not stated", never "Operating: Yes".
- [x] The staff review pages and the contributor and steward pages word a working proposal as one, not as a stop.

## Out of scope

- Editing an ungrouped route (the workspace edit still needs a route group).
- The map on the review page and route pages: no coordinates exist for imported stops, and the pages say so.

## Decisions

- The seed is a script over the APIs, not SQL, so a state can never be one the application would not produce.
