# Database Migrations & Seed Data Standardization Plan

**Goal:** Give every BusMate backend service one identical, versioned, reviewable database
lifecycle — schema migrations plus seed data — that works on **plain PostgreSQL** (no
Supabase-specific features) so any service can run against local Postgres, Supabase, RDS, Neon,
Cloud SQL, or any other Postgres provider without change.

**Status:** Phases 0–1 complete (2026-07-16). Phases 2–5 pending.

**Scope:** The three JVM services that own a database — `apps/backend/user-service`,
`apps/backend/core-service`, `apps/backend/ticketing-service`. `api-gateway` (Node, no database) is
out of scope.

**Author's note on stale artifacts:** The existing `core-service/src/main/resources/data.sql`,
`schema.sql`, and older `docs/database-*-guide.md` docs predate the self-hosted auth migration and
are **stale**. This plan is grounded in the *current* entity models, not those files, and
supersedes them; `data.sql`/`schema.sql` are removed in Phase 5 (they were already inert —
`spring.sql.init.mode: never`). `core-service`'s three old `db/migration/V00x` files (aspirational
Flyway-naming, never actually run) were retired in Phase 1 instead, ahead of schedule — see the
Phase 1 as-built notes below for why.

---

## 1. Current state (why we need this)

Every service uses Spring Data JPA / Hibernate with `spring.jpa.hibernate.ddl-auto: update`, and
since the `prod` profiles only override the datasource, **`ddl-auto: update` runs against production
too**. No service has Flyway or Liquibase on the classpath.

| Service | Schema management | Seed / reference data | Migration tool |
|---|---|---|---|
| `user-service` | `ddl-auto: update` | none in dev/prod (only `src/test/resources/data.sql`) | none |
| `core-service` | `ddl-auto: update` + `schema.sql` (triggers) | `data.sql` via `spring.sql.init` with `continue-on-error: true` | `db/migration/V00x` files in Flyway naming but **no Flyway** — manual/docs only |
| `ticketing-service` | `ddl-auto: update` | none | none |

### Problems

- **`ddl-auto: update` only adds.** It never drops, renames, changes types, or removes
  constraints. Dev and prod schemas drift silently. No history, no rollback, no review, no way to
  reproduce a known schema.
- **`spring.sql.init` + `continue-on-error: true` swallows seed failures silently** — you get a
  half-seeded database and no error.
- **Only one of three services has any seed data**, and it is an undifferentiated blob that mixes
  data the app *requires* with demo data that must *never* reach production.
- **Every service does it differently.**

### What the current models tell us (grounding facts)

- **user-service owns RBAC**: `user_types`, `permissions`, `user_type_permissions`,
  `user_permission_overrides`. **The platform cannot function without `user_types` and
  `permissions` populated** — this is required-in-every-environment reference data, not optional
  seed. There is currently no dev/prod bootstrapping for it.
- **user-service → core-service coupling**: an operator is a `users` row in user-service, propagated
  to core-service's `operator` table (`operator_user_id`) via the `operator_sync_outbox` → Kafka
  flow. **The same user UUID lives in two independent databases.**
- **core-service** is the rich domain (operators, routes, stops, schedules, buses, permits, trips)
  and holds the largest *demo* dataset.
- **ticketing-service** has fare tables (`base_fare`, `route_fare_section`) that are reference-ish,
  plus tickets/transactions that reference core's routes/trips by ID.
- **IDs cross database boundaries.** Random per-service seed IDs would never line up for
  end-to-end testing. This is the defining constraint the seed strategy must solve.

---

## 2. Decisions (locked)

1. **Flyway**, per service, **plain Postgres SQL migrations**.
   - Chosen over Liquibase because the team already writes Flyway-shaped SQL (`V001__…`), the schema
     uses PL/pgSQL triggers/functions (native in Flyway SQL, awkward in Liquibase changelogs), and
     BusMate is Postgres-everywhere so Liquibase's DB-agnostic changelogs buy nothing.
   - Spring Boot has first-class Flyway auto-configuration; migrations run on startup before
     Hibernate validates.
2. **No Supabase-specific features anywhere.** No `auth.*` schema, no RLS policies, no Supabase
   functions/extensions. Use only vendor-neutral Postgres — `gen_random_uuid()` (built into
   PostgreSQL 13+, no extension), standard DDL, `jsonb`. This keeps every service portable across
   Postgres providers.
3. **Hibernate stays as the ORM**, but `ddl-auto: validate` — it verifies entities match the
   Flyway-owned schema and never mutates it. The ORM and the schema-lifecycle tool are separate
   concerns.
4. **Flyway is the single source of truth** for every service database, including production. No
   competing Supabase CLI migrations for these service-owned schemas.

---

## 3. The three data tiers

The central idea: stop treating all non-schema data as one `data.sql`. Split it by *which
environments need it*.

| Tier | What | Environments | Mechanism |
|---|---|---|---|
| **1 — Schema** | tables, constraints, indexes, triggers, functions | all | `V__` versioned migrations |
| **2 — Reference / bootstrap** | data the app *requires to boot*: RBAC `user_types` + `permissions` + `user_type_permissions`, base fares | all (dev, test, prod) | `R__` repeatable migrations, idempotent upserts |
| **3 — Demo / dev seed** | Sri Lankan operators, routes, schedules, demo users/logins | dev + local test only | separate Flyway location, activated only under the `dev` profile |

Why the split matters:

- RBAC (Tier 2) **must** ship to production or nobody can log in.
- The Sri Lankan demo dataset (Tier 3) **must never** reach production.
- The old single `data.sql` conflated the two, which is exactly why it's unsafe.

`R__` (repeatable) migrations re-run whenever their checksum changes and are written idempotently
(`INSERT … ON CONFLICT (natural_key) DO UPDATE`), so they are safe on every boot and easy to evolve.

---

## 4. Standard layout (identical in every service)

```
src/main/resources/db/
  migration/                 # Tier 1 — schema, ALL envs
    V001__baseline.sql
    V002__<change>.sql
  reference/                 # Tier 2 — required data, ALL envs (repeatable, idempotent)
    R__001_user_types.sql
    R__002_permissions.sql
    R__003_user_type_permissions.sql
  seed/dev/                  # Tier 3 — demo data, DEV ONLY
    V900__demo_operators.sql
    V901__demo_routes.sql
```

Configuration:

```yaml
# application.yml (base, all environments)
spring:
  jpa:
    hibernate:
      ddl-auto: validate          # was: update — Hibernate checks, never mutates
  flyway:
    enabled: true
    locations: classpath:db/migration,classpath:db/reference
    baseline-on-migrate: true     # adopt existing ddl-auto-built DBs (see Phase 1)
    baseline-version: 1
```

```yaml
# application-dev.yml — adds the demo tier ONLY in dev
spring:
  flyway:
    locations: classpath:db/migration,classpath:db/reference,classpath:db/seed/dev
```

The old `schema.sql`, `data.sql`, and all `spring.sql.init` configuration are deleted (Phase 5).

**Version-number convention:** Tier 1 uses `V001`–`V899`; Tier 3 demo migrations use `V900+` so they
sort last and never collide with real schema changes. Tier 2 uses `R__` (repeatable, order by
filename).

---

## 5. Cross-service seed contract (the microservices-specific piece)

Because IDs cross database boundaries, demo data cannot use random per-service IDs — nothing would
line up for end-to-end testing. The rule:

> **Demo entities referenced across services use fixed, well-known UUIDs, defined once in
> `docs/dev-seed-contract.md`, and hard-coded identically in each service's `seed/dev` migrations.**

Example — demo operator "Kandy Express" = `00000000-0000-0000-0000-000000000001`:

- **user-service** seeds a `users` row (+ auth credential) with that UUID as an operator user.
- **core-service** seeds an `operator` row whose `operator_user_id` equals that UUID.
- **ticketing-service** seeds fares/tickets against core's demo route UUIDs.

This keeps the databases fully independent while making a full local stack coherent for testing. It
also mirrors production, where the `operator_sync_outbox` → Kafka flow propagates the same user UUID
from user-service into core-service.

`docs/dev-seed-contract.md` is the single registry of these canonical UUIDs (demo operators, demo
users/logins, demo routes/stops, demo trips). Any new cross-service demo entity gets its UUID
allocated there first, then referenced from the service migrations.

---

## 6. Implementation plan (phased)

### Phase 0 — Foundation (shared, no behavior change) — ✅ complete

1. ~~Add `flyway-core` and `flyway-database-postgresql` (Flyway 10+) to a shared parent POM (or each
   service POM if there is no parent).~~ Done: no shared parent POM exists (each service parents
   directly off `spring-boot-starter-parent`, at slightly different versions — 3.5.3 for
   user-service/core-service, 3.5.4 for ticketing-service), so both dependencies were added
   individually to all three service POMs. Version is unmanaged (inherited from the Spring Boot
   BOM) and resolved to **Flyway 11.7.2** in all three, confirmed via `mvn dependency:tree`.
2. ~~Land this plan and `docs/dev-seed-contract.md`~~ Done: this plan and
   [`docs/dev-seed-contract.md`](../dev-seed-contract.md) (the canonical UUID registry, empty except
   for the allocation convention) are both landed.
3. ~~No config flip yet~~ Done, but with one addition beyond the original plan text: since Flyway
   auto-configures itself the moment it's on the classpath (Spring Boot will otherwise try to run it
   against `classpath:db/migration` on next boot, creating a `flyway_schema_history` table even
   with zero migration files present — a real side effect this phase was meant to avoid), each
   service's `application.yml` explicitly sets `spring.flyway.enabled: false` with a comment
   pointing at Phase 1, which is where it gets switched on for real. `ddl-auto` is untouched
   (`update`, unchanged) — that flip is Phase 1's job, gated on the baseline migration existing.
   Verified all three services still `mvn compile` cleanly with Flyway on the classpath.

### Phase 1 — Baseline each existing database (the fiddly part) — ✅ complete (2026-07-16)

Tables today were built by `ddl-auto`, so there is no Flyway history table. Per service:

1. ~~Generate `V001__baseline.sql` from the **current** schema~~ Done, against the local dev
   Postgres container (`docker-compose.yml`'s `postgres` service): dropped and recreated
   `busmate_user`/`busmate_core`/`busmate_ticketing` fresh, ran each service once with the
   then-current `ddl-auto: update` to build the real current schema (this caught that the dev
   volume's existing tables were themselves stale — `busmate_user` was missing `auth_audit_log`,
   the newest entity, until this run), then
   `pg_dump --schema-only --no-owner --no-privileges --no-comments`. Scrubbed pg_dump 16.13's
   `\restrict`/`\unrestrict` psql-only meta-commands (new in this Postgres version — not valid SQL,
   Flyway would fail parsing them) and the session-level `SET ...` boilerplate, keeping only the
   `CREATE TABLE`/constraint/index statements. Result sizes: user-service 445 lines, core-service
   577 lines, ticketing-service 251 lines.
   - **core-service's three old `db/migration/V001–V003` files were deleted, not kept.** They
     occupied the same version slot the real baseline needs (Flyway forbids two migrations both
     claiming version 1), and inspection confirmed their entire effect — the `route` FK constraints
     to `stop`, the `version` optimistic-locking columns, `operator.user_id` — was already present
     in the freshly-dumped current schema (Hibernate had built all three from the live entities
     regardless, since the files were never actually executed by anything — the README said so
     outright). Deleting them was originally slated for Phase 5's cleanup pass; doing it now was
     unavoidable, not scope creep.
2. `spring.flyway.baseline-on-migrate: true` / `baseline-version: 1` / `locations:
   classpath:db/migration` set in all three `application.yml`. (`db/reference` and `db/seed/dev`
   are not yet in `locations` — those directories don't exist until Phases 2–3.)
3. Flipped `ddl-auto` from `update` to `validate` in all three.
4. **Two real bugs found and fixed along the way, both would have broken every future boot:**
   - **YAML mis-nesting from Phase 0.** The `spring.flyway` block Phase 0 inserted was spliced
     between `spring.jpa.hibernate` and `spring.jpa.properties`, at the same 2-space indent as
     `jpa:` — which is correct for `flyway:` itself, but it left `properties:` (and
     `defer-datasource-initialization`, `database-platform`) at their original 4-space indent
     immediately following `flyway.enabled: false`, silently reparenting them as
     `spring.flyway.properties` instead of `spring.jpa.properties`. Spring Boot's relaxed binding
     ignored the unrecognized nested map rather than erroring, so `format_sql`, `dialect`,
     `jdbc.batch_size`, etc. were quietly not applied to Hibernate from the moment Phase 0 landed
     until this fix — never caught because Phase 0 was compile-only verification, and Hibernate 6
     auto-detects the dialect from the JDBC connection anyway so nothing *broke*, it just silently
     stopped honoring those settings. Fixed by moving the `flyway:` block after the complete `jpa:`
     block (verified with a `PyYAML` parse asserting `jpa.properties.hibernate.dialect` resolves
     correctly in all three files).
   - **`spring.jpa.defer-datasource-initialization: true` + Flyway = circular dependency.**
     Enabling Flyway with that flag still set produced `Circular depends-on relationship between
     'flyway' and 'entityManagerFactory'` on every boot attempt (reproduced identically via both
     `mvn spring-boot:run` and a packaged `java -jar`, ruling out a devtools/restart-classloader
     explanation). The flag was dead weight regardless — it only matters when
     `spring.sql.init.mode` is not `never`, and all three services hard-code `mode: never` — so it
     was removed from all three `application.yml`, which resolved the cycle.
5. **Verified both scenarios the plan calls for, for all three services**, using a packaged
   `java -jar` (not `spring-boot:run`, to match how Docker/production actually boots and avoid
   devtools noise):
   - **Existing DB** (already had the full current schema from step 1's `ddl-auto` run — the
     realistic case for a long-lived dev volume or Supabase prod): Flyway recorded a `BASELINE` row
     at version 1 (not a re-run migration) in `flyway_schema_history`, `ddl-auto: validate` passed,
     app started.
   - **Fresh, empty DB** (dropped and recreated all three databases): Flyway actually ran
     `V001__baseline.sql` (log: `Migrating schema "public" to version "001 - baseline"`), recording
     a `SQL`-type success row at version 1; resulting table count matched the existing-DB case
     exactly; `ddl-auto: validate` passed; app started. Required a `clean` build first — a plain
     `package` left core-service's deleted `V001–V003` files sitting in `target/classes` from an
     earlier build (Maven doesn't prune stale resources), which surfaced as Flyway's "Found more
     than one migration with version 001" until `mvn clean package` was used.
6. Left the local dev Postgres volume in the fresh-DB, V001-migrated state (no demo data yet —
   that's Phase 3). Production/Supabase baselining was **not** performed as part of this
   phase — deploying and baselining against the real Supabase project is a separate,
   higher-stakes action outside a local implementation task; the mechanism (steps 2–3 above) is in
   place and ready for that when it happens.

Do this one service at a time; verify each boots clean against both a fresh DB and an existing one.

### Phase 2 — Extract reference data (Tier 2)

Do **user-service first** — its RBAC gates every login on the platform.

1. Author `R__` repeatable migrations for `user_types`, `permissions`, and
   `user_type_permissions`, using `INSERT … ON CONFLICT (<natural key>) DO UPDATE`. Idempotent and
   safe on every boot, in every environment. This replaces the ad-hoc/test-only RBAC data with a
   real, versioned bootstrap.
2. ticketing-service: base/route fare reference tables as `R__` migrations if they are required for
   the service to compute fares.
3. core-service: likely needs none (enums are string-valued in the entities, no lookup tables).

### Phase 3 — Rebuild demo seed (Tier 3)

1. **Discard** the stale 394-line `core-service/data.sql`. Rewrite the Sri Lankan demo dataset from
   the *current* entities as `seed/dev` migrations, using the fixed UUIDs from
   `docs/dev-seed-contract.md`.
2. Ordering across services: user-service demo users/operators → core-service
   operators/routes/schedules → ticketing fares/demo tickets.
3. Make each migration idempotent (`ON CONFLICT DO NOTHING`) so re-runs and partial states are safe.
4. Keep the resulting login list documented (successor to
   `docs/operator-conductor-seed-credentials.md`).

### Phase 4 — Tests & CI

1. Switch integration tests to **Testcontainers Postgres** so Flyway migrations (Tiers 1 and 2) run
   against a real Postgres in CI — this validates every migration on every PR and removes the H2/
   Hibernate-DDL divergence.
2. Replace `src/test/resources/data.sql` with the reference tier plus a minimal, test-specific seed.
3. Add a CI gate: a clean-database `flyway migrate` + `flyway validate` to catch edited or
   out-of-order migrations before merge.

### Phase 5 — Rollout & cleanup

1. **Local dev:** `docker compose down -v && docker compose up` yields a fully migrated + reference +
   demo-seeded stack, reproducibly, every time. `scripts/postgres/init-dev-dbs.sql` stays (it only
   `CREATE DATABASE`s the three DBs; Flyway owns everything inside each).
2. **Production (Supabase or any provider):** baseline once (Phase 1), then migrations apply on
   deploy. Tier 2 flows automatically; Tier 3 never loads (not in prod's `locations`).
3. **Delete stale artifacts:** `core-service/schema.sql`, `core-service/data.sql`,
   `core-service/db/migration/README.md` + `V00x` files, and all `spring.sql.init` config. Update or
   retire the stale `docs/database-management-guide.md` / `docs/database-reset-and-seed-guide.md`.

---

## 7. Rollout order across services

**user-service → ticketing-service → core-service.**

- **user-service first**: its RBAC (Tier 2) gates the whole platform, and it's the newest/cleanest
  service after the self-hosted auth migration — the lowest-risk place to prove the pattern.
- **core-service last**: it has the largest demo dataset to rewrite (Tier 3) and the most triggers/
  functions to fold into the baseline.

Each service is independently shippable — the phases can complete for user-service before
ticketing-service starts.

---

## 8. Risks & sharp edges

- **Baseline drift (Phase 1):** flipping to `validate` will surface real mismatches that `update`
  was hiding. This is expected and desirable, but budget time to reconcile each. Do it per service,
  not all at once.
- **Cross-service UUID discipline (Phase 3):** the seed contract only works if every service uses
  the *same* fixed UUIDs. Allocate in `docs/dev-seed-contract.md` first, reference second — never
  invent an ID inline.
- **Repeatable-migration idempotency (Phase 2):** every `R__` must be safe to re-run against a
  populated table. Always use natural-key `ON CONFLICT`, never blind `INSERT`.
- **Provider portability:** keep the baseline and all migrations free of provider-specific SQL so a
  future move to a different Postgres host is a connection-string change, nothing more.
```
