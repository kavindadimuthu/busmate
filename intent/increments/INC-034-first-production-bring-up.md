---
id: INC-034
title: The production stack starts on the VPS, and its first admin can sign in
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

`docker-compose.production.yml` from INC-032 comes up on the production VPS, and a person with no seed
data and no existing account can end up signed in to the staff portal over HTTPS as its first admin.

## Why now

INC-032 wrote the production stack and INC-033 fixed what a code review of it turned up. Neither had
ever been started. Bringing it up for the first time is what shows whether it works, and it turned up a
registry reference that no longer exists. Independently, production has no seed data by design, so even
a perfectly healthy stack has nobody able to sign in.

## Design

- **MinIO comes from quay.io.** The stack pointed at `minio/minio` on Docker Hub, which MinIO no longer
  publishes to. It now uses the same pinned quay.io image as the development stack, with that stack's
  healthcheck, and the bucket-init step also asserts the bucket is not anonymously readable.
- **`scripts/bootstrap-admin.sh <email> "<name>"`** creates the first admin directly in user-service's
  database and refuses to run if any admin already exists, so it cannot later mint a second one. The
  generated password goes to a mode-600 file, never to the terminal.
- **`intent/context.md`** now says production exists, records that telemetry-service, EMQX and the
  simulator are deliberately not deployed, and lists the debts this work exposed.

## Acceptance criteria

- [x] The production stack starts from a fresh clone, pulling every image from a registry that has it.
- [x] The media bucket exists and is not anonymously readable.
- [x] A first admin can be created on a stack with no seed data.
- [x] Running the bootstrap a second time is refused.
- [x] That admin can sign in to the portal at `https://portal.busmate.site` and read its own profile.
- [x] `intent/context.md` matches the production topology.

## Out of scope

- Hiding passenger booking, which still uses the dummy payment gateway.
- Backups and a restore drill, the deploy pipeline, and an email provider for password resets.
- Loading any pilot network data.
- Bringing account creation through user-service's own API, so its validation applies.

## Constraints

- R3: `docker-compose.production.yml`, and a script that writes credentials into the auth database. Named
  reviewer required, and the script deserves a careful line-by-line read.
- The script is meant to run once per environment, from the host. It is a bootstrap, not a
  provisioning tool: every later account is created through the portal.

## Open questions

- The script inserts rows directly, so it bypasses user-service's own validation. If the password or
  email rules ever change, its output may stop satisfying them and nothing would say so until sign-in.
  A first-admin path inside the service would remove that risk, at the cost of an unauthenticated
  endpoint that needs its own guard.

## Decisions

- See ADR-020
