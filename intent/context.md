# Project Context

> The file every agent reads before every task. HACO §17: *"If you adopt nothing else from this
> document, adopt that one file."*
>
> **Editing rule:** delete anything that stops being true, the same day it stops being true. A stale
> context file actively misleads every agent that reads it, which is worse than no context file.
> It restates nothing that git, CI, the code, or the root [README.md](../README.md) already owns.

---

## What this system does

BusMate is the authoritative record of every scheduled passenger bus trip in Sri Lanka. Operators,
crew, depots, regulators and passengers all hold a stake in the *same* trip record — that shared
record, not any one app, is the product. See [vision.md](vision.md) for the boundary test.

It is deployed to production at busmate.site on one self-hosted VPS — Docker Compose, our own Postgres,
Caddy for TLS ([ADR-020](decisions/ADR-020-self-hosted-postgres-on-one-vps.md)) — with **zero paying
customers and no live tenant**. Only staff and pilot contributors use it, and nothing described below has
been validated by real passenger or operator use.

## Architecture

A **modular monolith per domain**, deployed as five backend services behind one gateway
([ADR-003](decisions/ADR-003-modular-monolith-over-microservices.md)). Decomposition is **by data
ownership, not by product** ([ADR-002](decisions/ADR-002-decompose-by-data-not-by-product.md)) — so
services do not map one-to-one onto the frontends that call them.

Every frontend calls **only** `api-gateway` (`:8080`). Nothing talks to a Spring service directly.

Production deploys a subset: `telemetry-service`, EMQX and the bus simulator are **not** in
`docker-compose.production.yml` (no hardware trackers, no live ETAs yet — INC-032).

| Service | Owns (domain) | Port |
|---|---|---|
| `api-gateway` (Node/TS) | Routing, BFF session/auth enforcement, live endpoints | 8080 |
| `user-service` (Spring) | Identity — accounts, RBAC, permissions, profiles, tenancy | 9020 |
| `core-service` (Spring) | Network, Scheduling, Operations, Fleet, Licensing, Passenger info | 9010 |
| `ticketing-service` (Spring) | Fares, tickets, bookings, settlement | 9030 |
| `telemetry-service` (Spring) | Device registry, position, vehicle health | 9040 |

Frontends: `new-react-portal` (Vite — MOT/operator/admin/timekeeper), `passenger-web` (Vite),
`passenger-mobile` + `conductor-mobile` (Expo/React Native).

`core-service` packages by feature then layer: `com.busmate.routeschedule.{network, scheduling,
operations, fleet, licensing, passengerinfo}/{controller, service, repository, entity, dto}`.
`user-service` uses a flatter `com.busmatelk.backend.*` layout — this divergence is known debt.

## What is actually built

Read this before believing a screen. A polished UI here does not imply a working feature.

**BusMate is a service-registry and day-of-operations execution platform, not a planning platform.**
The middle of the transit pipeline is genuinely built and wired end to end: network registry,
timetables with calendars and dated exceptions, trip materialisation, permit-gated operator
assignment, conductor execution, ticketing. Both ends are thin — there is no planning support
upstream (no demand data, no design analysis, frequencies implicit in hand-authored timetables), and
the feedback loop downstream is broken.

Four cross-cutting themes recur almost everywhere, and they explain most of what looks odd:

1. **The feedback loop is the biggest structural gap.** Nothing captures per-stop actual times or
   vehicle positions, so nothing downstream can inform anything upstream. The
   `ScheduleStop.*Unverified/*Calculated` columns and the unused `boarding`/`departed`/`delayed` trip
   statuses show the loop was anticipated in the data model and never built.
2. **UI-first development left mock shells.** Tracking, analytics, revenue, fares, policies,
   timekeeper and salaries are complete polished UIs rendering generated data from `data/**/*.ts`.
   Collectively they overstate real capability — do not treat a screen as evidence of a backend.
3. **There is no conflict or constraint validation anywhere.** The same bus or conductor can be
   assigned to overlapping trips; overlapping schedules on a route go undetected; lifecycle
   transitions are unguarded.
4. **The decentralised-operator model is deliberate, not accidental.** MOT authors the network and
   timetables; private operators supply vehicle and crew per trip via PSP permits. Classic
   centralised optimisation (vehicle blocking, crew rostering) therefore does not apply — the useful
   improvements are assistance and validation *for* operators, not global optimisers.

Genuine strengths worth preserving: trilingual (EN/Sinhala/Tamil) master data throughout; a GTFS-like
scheduling model with calendars, dated exceptions and effective windows; role separation enforced at
the API with ownership checks; public auth-free passenger search that correctly applies stop
ordering, calendars and exceptions in a single query; and a three-tier time model that surfaces
partial timetable knowledge honestly instead of faking certainty.

## Stack

Nx + pnpm monorepo · Java 17 / Spring Boot (Maven Wrapper, outside the pnpm workspace) · Node 20+ /
TypeScript · React + Vite · Expo · PostgreSQL (Flyway) · Kafka · MQTT · Docker Compose ·
Playwright (e2e) · Storybook (`libs/ui`).

Commands, Nx usage and cross-platform wrapper rationale live in the root [README.md](../README.md).
**Do not restate them here.**

## Invariants

Violating one of these is a bug, not a design choice.

1. **Frontends call the gateway only.** No frontend holds a Spring service URL.
2. **One owner per entity.** A service never reads or writes another service's tables. Cross-domain
   data moves over the API or events.
3. **Reference data flows inward, always** —
   [ADR-006](decisions/ADR-006-reference-data-flows-inward-always.md).
4. **Tenant isolation is enforced in the database via RLS**, not in application code —
   [ADR-005](decisions/ADR-005-tenant-isolation-via-database-rls.md). **Today that is true only for
   telemetry-service's vehicle tables** (INC-024); every other service is still application-level — see
   Known debt. New operator-scoped data carries `operator_id` from its first migration so RLS can be
   switched on without a retrofit.
5. **Schema changes happen only through Flyway migrations.** `db/migration` (schema) and
   `db/reference` (reference data) are append-only — never edit an applied migration. `ddl-auto` must
   stay off.
6. **Cross-service demo entities use the fixed-UUID registry** in the seed contract. Inventing a UUID
   for an entity that crosses a service boundary silently breaks other services' seeds.
7. **Never take custody of fare money.** Payments go through a partner PSP —
   [ADR-008](decisions/ADR-008-operator-first-go-to-market.md) and vision anti-scope.
8. **No personal data in logs**, and passenger-facing surfaces expose vehicle-level position only,
   never driver-level.
9. `mvnw` and `*.sh` stay LF — enforced by [.gitattributes](../.gitattributes). CRLF breaks them
   inside Linux containers.

## Conventions

- **Nx**: always `pnpm run nx`, never `npx nx` (daemon and plugin isolation must stay off). `dev` is
  the run verb for every app.
- **`libs/ui` naming** is fully specified in
  [.github/instructions/ui-library-naming-conventions.instructions.md](../.github/instructions/ui-library-naming-conventions.instructions.md),
  which auto-applies to `libs/ui/**`. That file is authoritative; this one does not duplicate it.
- **API clients** in `libs/api-clients/` are **generated** from each service's OpenAPI output. Never
  hand-edit them — change the controller/DTO and regenerate.
- **Backend tests** boot a real Postgres via Testcontainers and run the actual Flyway migrations
  (`AbstractPostgresIntegrationTest`). No H2, no Hibernate DDL in tests.
- **Provenance on network records.** `stop`, `route`, `route_group` and `schedule` carry a source tier,
  observed-at, confidence and credit ([ADR-018](decisions/ADR-018-community-changes-are-reviewed-changesets.md)).
  Any new write path to those tables goes through `ProvenanceStamper`; a path that skips it is caught only
  by a `PrePersist` default that labels the record `SRC_4` "BusMate", which is honest but loses the source.
- **Passenger-facing trust.** A time or route shown to a passenger carries a label from `TrustLabels`
  (official / operator timetable / observed / reported / estimated / live); never wire a new passenger
  surface to a raw time column without one. The unauthenticated stop, route and schedule reads must not
  expose who contributed a record — display credit only.
- **A stop's `attributedUserId` is never in a response the public endpoints return.** Only staff-only
  reads (a changeset's `proposerUserId`) may carry the real contributor identity; the stop's own
  provenance label stays generic ("Community contributor") even after review credits them.
- **A contributor's proposal never writes the canonical tables.** It lands in `community.changeset`
  as a proposed value set; only the review flow (INC-031) applies it. Never let a proposal endpoint
  call a staff write path directly, however tempting that shortcut looks.
- **Community standing lives in core-service, not user-service.** A contributor is still a
  `passenger` account; `core-service`'s `community` module (ADR-019) is the only source of what they
  may do to the network. Never add a `contributor` user type or check standing from the JWT.
- **Anchors** (HACO §4.2): branch name contains the increment ID; every commit carries an
  `Increment:` trailer, enforced by [.githooks/commit-msg](../.githooks/commit-msg); acceptance tests
  name the increment ID. Code comments carry the ID only where intent is genuinely non-obvious.

## Known debt

Deliberately unfixed. Each is a backlog candidate, not a surprise.

- **CI covers backend only**, and [backend-ci.yml](../.github/workflows/backend-ci.yml) has never run
  on GitHub Actions. There is no frontend lint/test/e2e gate. This is why `policy.yaml` caps frontend
  autonomy at A2 despite frontend code being R1 — the evidence that would justify A3 does not exist
  yet. **Fixing this is the highest-leverage available increment.**
- `user-service` package layout diverges from the other Spring services.
- `SupabaseAuthClient` is dead code awaiting decommission (self-hosted auth Phase 7).
- Passenger self-booking still pays through a dummy gateway; only conductor-collected card payments
  are real (PayHere, [ADR-010](decisions/ADR-010-payhere-for-conductor-card-payments.md)). The
  PayHere `notify_url` webhook is unverified until the backend is publicly reachable.
- Revenue grouping follows [ADR-011](decisions/ADR-011-revenue-grouped-by-custody-listed-by-method.md)
  and ticket categorisation follows
  [ADR-012](decisions/ADR-012-tickets-grouped-by-sale-stage-listed-by-channel.md) in conductor-mobile
  only. The staff portal still splits tickets "Cash (Conductor)" vs "Online" from `issueMethod`,
  which also mislabels card fares as cash.
- Mobile apps duplicate copies of generated API clients rather than consuming `libs/api-clients`.
- **Row-level security exists in one service only.** telemetry-service enforces it on its vehicle
  tables through a restricted runtime role that cannot bypass it (INC-024,
  [ADR-016](decisions/ADR-016-runtime-database-role-cannot-bypass-row-level-security.md)). core-service,
  user-service and ticketing-service still connect as the `postgres` superuser, which bypasses RLS even
  on forced tables, so their operator isolation is application-level (INC-016, INC-021) and fails
  open. Each needs an owner role, a runtime role and a tenant-context hook; core-service first.
- Passenger live ETAs do not exist; analytics and revenue surfaces run on mock data. The admin
  dashboard's remaining user and transaction figures are part of that. Its *operations* surfaces no
  longer invent anything — they say they are unwired (INC-038, ADR-021).
- `user-service` reports a missing or malformed request parameter as HTTP 500, not 400 — its
  `GlobalExceptionHandler` catches them as unhandled. Found by calling `GET /api/users` without
  `user_type` and `/api/users/me` (parsed as a UUID) against production.
- **Production's observability floor is up and alerting** (`docker-compose.observability.production.yml`,
  [ADR-021](decisions/ADR-021-operational-telemetry-lives-in-grafana.md), INC-035, INC-036) —
  Prometheus, Loki, Grafana, cAdvisor, node-exporter, Alloy and `blackbox-exporter` (probing
  Postgres/MinIO, neither of which exposes its own metrics), bound to `127.0.0.1` only, reachable
  over an SSH tunnel. Nine alert rules route by severity to a Discord contact point,
  live-verified end to end. Tracing stays off: Tempo isn't part of it, and
  `OTEL_SDK_DISABLED=true` stands in `docker-compose.production.yml`. `uptime-kuma` still has no
  monitors configured — a manual one-time setup (README.md), never part of either increment's
  acceptance criteria.
- No logical backups, and no deploy pipeline: production is updated by hand over SSH. The provider's
  daily VM snapshot is running, which restores a machine rather than a table, lives in the account that
  would be lost, and has never been tested. INC-037.

## Out of bounds

An agent must ask a human before doing any of these. The authoritative list is `always_human` in
[policy.yaml](policy.yaml) — that file governs; this is a pointer, not a copy.

In short: no new third-party dependencies, no migrations run against a shared environment, no
relaxing of a security control or RLS policy, no changing a published contract without regenerating
clients, and no editing an already-applied migration.
