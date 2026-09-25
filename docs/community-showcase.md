# Community showcase data

Every community flow, already in place, so nothing has to be entered by hand to look at it.

```
# backend and gateway running against your dev database, dev seed applied
node scripts/seed-community-showcase.mjs            # or --api http://localhost:8090
```

It signs in as the dev-seed accounts ([dev-seed-credentials.md](dev-seed-credentials.md)) and uses the real APIs, so
each state below is one the application really produces. Safe to run twice; it skips what is there. Dev only.

## Where to look, and as whom

| To see | Sign in as | Go to |
|---|---|---|
| A community timetable as **reports**: "Usually Sample Express · AA-1111", labelled *Reported*, "Days not stated" | nobody | passenger-web → FindMyBus, Embilipitiya → Colombo, next Monday; open a departure |
| A route known only in part ("These are only some of this route's stops"), dated to the post | nobody | passenger-web → Routes → Embilipitiya – Colombo via old road (03) |
| **Add a stop** to a partly-known route without breaking its times | mot@busmate.test | portal → Routes → the Embilipitiya route (eye icon) → Stops → *Add a stop* |
| The steward's queue: waiting, approved, rejected | steward.tharindu@busmate.test | passenger-web → /contribute/review |
| Every proposal state (under review, approved, not approved with the reviewer's note, withdrawn, reverted) | contributor.amara@busmate.test | passenger-web → /contribute/mine |
| **Propose who runs a departure** | contributor.amara@busmate.test | a Colombo–Kandy departure's page → "Know who runs this bus? Tell us" |
| A pending working proposal to **decide** (approve or reject) | steward.tharindu@… or mot@… | queue: "Showcase Pending Travels" |
| A pending stop proposal to decide | same | queue: "Showcase Pending Stop", "Peradeniya Road Junction" |
| Staff review of a proposal, and **Revert** on an approved stop correction | mot@busmate.test | portal → Community → Review → Approved |
| Staff-recorded workings: one current, one ended | mot@busmate.test | portal → Schedules → Colombo-Kandy Morning Express → *Usual Workings* |
| An **approved** working shown to passengers ("Usually Showcase Approved Express") | nobody | the Kandy–Colombo afternoon express |

## What is left for you to do by hand

Approve or reject the pending items, add a stop to the Embilipitiya route, propose something new. Applying as a
contributor and accepting or appointing someone uses the seeded applicant `applicant.nadeesha@busmate.test`
(portal → Community → Contributors). "Ready to promote" lists nobody until a contributor has enough approved
proposals: start core-service with `COMMUNITY_PROMOTION_MIN_APPROVED=1 COMMUNITY_PROMOTION_MIN_DAYS_ACTIVE=0`.

The seed changes the description of two existing Colombo–Kandy stops (one correction stays, one is reverted).
