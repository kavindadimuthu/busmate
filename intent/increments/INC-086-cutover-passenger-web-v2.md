---
id: INC-086
title: Cutover — busmate.site serves passenger-web v2; the old app is retired but kept
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

busmate.site serves passenger-web v2 on the backend now in `main`, and the old passenger-web stays in the repository,
retired, ready to bring back.

## Why now

v2 reached parity (INC-084) and has the route map (INC-085). Production has no real users yet, so the owner chose a
straight replacement over a trial on a second address.

## Acceptance criteria

- [ ] A backup of the production databases is taken immediately before the deploy.
- [ ] The backend from `main` runs on production, core-service migrations V011 to V017 applied, every service healthy.
- [ ] busmate.site serves v2 over HTTPS: pages load, deep links load, sign-up and log in work, the API is same-origin.
- [ ] The portal, api.busmate.site and status.busmate.site still work.
- [ ] Online booking stays closed in production; applying to contribute still needs a verified email.
- [ ] The old passenger-web is marked retired, still builds, and the way back is written down.

## Out of scope

- Real email in production, real payments, loading network data, deleting the old app, moving the flow tests.

## Constraints

- R3 paths (`config/caddy/**`, `docker-compose.production.yml`): a human reviews before merge.
- Rollback: revert this PR and rebuild `caddy` (minutes). Migrations are not rolled back; the pre-deploy backup is the
  way back for data.
