---
id: INC-032
title: A production stack that actually serves busmate.site over HTTPS from one VPS
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

`docker compose -f docker-compose.production.yml up` on the production VPS brings up the database,
the backend, both web frontends and TLS termination, and `busmate.site` serves real passengers over
HTTPS. Today that file starts five services against a database that does not exist, with no way in
from the internet.

## Why now

The platform has a live tenant for the first time: a Spaceship VPS in Singapore, and the domain
`busmate.site`. Everything else in the launch depends on this file being real — there is nowhere to
run a migration, create an admin or load pilot data until the stack stands up.

## Design

- **Postgres joins the stack.** One `postgres:16-alpine` on the internal network only, never published
  to the host, with a named volume and a healthcheck. An init script creates one database per owning
  service (`busmate_core`, `busmate_user`, `busmate_ticketing`) plus the roles, mirroring
  `scripts/postgres/init-dev-dbs.sql`. This replaces the Supabase-hosted assumption the `prod` profiles
  were written against — see ADR-020.
- **Caddy terminates TLS** and is the only container publishing ports (80, 443). It obtains and renews
  Let's Encrypt certificates automatically. `busmate.site` and `www.` serve `passenger-web`;
  `api.busmate.site` proxies `api-gateway`; `portal.busmate.site` serves `new-react-portal`.
- **Both frontends get a Dockerfile** — a Vite build stage, then their static output copied into the
  Caddy image's web root. They are files, not servers; nothing runs per frontend.
- **Every container gets a memory limit, and every JVM an explicit heap cap.** Five JVMs left to their
  own defaults each claim a quarter of host RAM and the 7.8 GiB host would thrash. The limits are sized
  to leave roughly 2 GiB of headroom.
- **telemetry-service, EMQX and the bus simulator are not in this stack.** There are no hardware
  trackers and no live ETAs at launch; core-service's only use of telemetry is the live-ETA lookup,
  which already falls back to schedule-based times. Redpanda stays: user-service publishes on real
  write paths, and losing those silently is worse than the ~700 MiB.
- **MinIO stays on the VPS** rather than an external S3, because the owner's stated intent is to run
  the system independently of any managed provider. The `MEDIA_S3_*` seam means this is one endpoint
  change if that ever stops being true.

## Acceptance criteria

- [ ] `https://busmate.site` serves passenger-web with a valid certificate, and HTTP redirects to HTTPS.
- [ ] `https://api.busmate.site` reaches api-gateway, and a passenger can search routes over it.
- [ ] `https://portal.busmate.site` serves the staff portal and a staff account can sign in.
- [ ] Postgres is unreachable from the internet; only 80, 443 and SSH are open on the host.
- [ ] Every service comes up from an empty volume with Flyway applying its own migrations.
- [ ] With the whole stack running and idle, the host has at least 1.5 GiB of memory free.
- [ ] No container publishes a port to the host except Caddy.

## Out of scope

- The deploy pipeline (CI, image build, rollback) — its own increment.
- Backups and their restore drill — its own increment.
- The production-readiness code fixes (trust proxy, rate limits, signing keys, the hardcoded Supabase
  defaults) — INC-033.
- Pilot network data and the first admin account.
- Observability on the VPS; `docker-compose.observability.yml` is unchanged and not deployed yet.

## Constraints

- R3: `docker-compose.production.yml` and `config/secrets/**`. Named reviewer required.
- The first migration against this database is `always_human` — the owner runs or approves it.
- Secrets stay out of git. The production `.env` is written on the server only, from
  `.env.example`, and every value in it is newly generated — no dev secret is reused, and the
  Supabase keys in the public history are treated as compromised regardless.
- Service ports and internal URLs stay topology, set in the compose file; only secrets live in `.env`.

## Open questions

- MinIO on the same host shares the disk and the memory budget with Postgres. Fine at pilot volume;
  worth revisiting before photos become common.
- Redpanda is kept for safety, not because anything consumes its topics in this stack today.

## Decisions

- See ADR-020
