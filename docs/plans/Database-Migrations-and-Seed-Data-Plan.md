# Database Migrations & Seed Data Standardization Plan

**Goal:** Give every BusMate backend service one identical, versioned, reviewable database
lifecycle — schema migrations plus seed data — that works on **plain PostgreSQL** (no
Supabase-specific features) so any service can run against local Postgres, Supabase, RDS, Neon,
Cloud SQL, or any other Postgres provider without change.

**Status:** Phases 0–3 complete (2026-07-17). Phases 4–5 pending.

**Scope:** The three JVM services that own a database — `apps/backend/user-service`,
`apps/backend/core-service`, `apps/backend/ticketing-service`. `api-gateway` (Node, no database) is
out of scope.

**Author's note on stale artifacts:** The existing `core-service/src/main/resources/data.sql`,
`schema.sql`, and older `docs/database-*-guide.md` docs predate the self-hosted auth migration and
are **stale**. This plan is grounded in the *current* entity models, not those files, and
supersedes them. `data.sql` was removed in Phase 3 (superseded by the real `seed/dev` migrations
there; it was already inert — `spring.sql.init.mode: never`). `schema.sql` (trigger definitions,
unrelated to seed data) is unaffected and still slated for removal in Phase 5. `core-service`'s
three old `db/migration/V00x` files (aspirational Flyway-naming, never actually run) were retired
in Phase 1 instead, ahead of schedule — see the
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

### Phase 2 — Extract reference data (Tier 2) — ✅ complete (2026-07-16)

Do **user-service first** — its RBAC gates every login on the platform.

1. ~~Author `R__` repeatable migrations for `user_types`, `permissions`, and
   `user_type_permissions`~~ Done:
   [`R__001_user_types.sql`](../../apps/backend/user-service/src/main/resources/db/reference/R__001_user_types.sql),
   `R__002_permissions.sql`, `R__003_user_type_permissions.sql`, all `INSERT … ON CONFLICT
   (<natural key>) DO UPDATE`. Content was **not invented** — cross-checked against two independent
   sources that agreed exactly: `src/test/resources/data.sql` (which states it "mirrors Phase 2's
   real Supabase migrations 001/004/005 exactly") and every literal `@RequiresPermission("...")`
   string actually used across `UserTypesController`, `PermissionsController`, and
   `UserPermissionOverridesController`. Result: 6 user types, 28 permissions, 56
   user-type↔permission grants, matching the test fixture's counts exactly.
   - `user_types.name` and `permissions.name` already had unique constraints (confirmed in Phase
     1's baseline dump), so those two upserts had a natural conflict target immediately.
     `user_type_permissions` did not — the entity only declares a surrogate `id` primary key — so
     a real schema migration, `V002__add_user_type_permissions_unique_constraint.sql`, adds
     `UNIQUE (user_type_id, permission_id)` first (with a defensive dedupe `DELETE` before the
     `ADD CONSTRAINT`, in case any real environment ever inserted a duplicate pair before the
     constraint existed). Flyway always runs every pending versioned migration before any
     repeatable one, so `R__003`'s `ON CONFLICT (user_type_id, permission_id)` is guaranteed to
     have that constraint in place.
   - `admin`'s row grants **every** permission (28/28) — carried over faithfully from the source
     fixture's unconditional `(ut.name = 'admin')` clause with no permission filter.
   - `spring.flyway.locations` for user-service became `classpath:db/migration,classpath:db/reference`
     (base `application.yml`, so this tier loads in every environment, dev and prod alike).
2. **ticketing-service: investigated and confirmed not required**, contrary to the plan's
   conditional wording. `base_fare`/`route_fare_section` have no bootstrap loader anywhere in the
   codebase — `BaseFareServiceIMPL.saveSection`/`RouteFareServiceIMPL.saveRouteFare` are the only
   writers, both plain admin-facing CRUD endpoints. Nothing in the service requires these tables
   to be non-empty to start or to serve any other request; they're operator-entered configuration,
   not platform-required reference data like RBAC. Also avoided the alternative of hardcoding
   government NTC fare figures I have no verified-current source for into a migration that would
   run in every environment including production. No `R__` migrations added for ticketing-service.
3. core-service: confirmed, as predicted — no lookup tables, all enums are Postgres `CHECK`
   constraints on string columns. No `R__` migrations added.
4. **A real regression surfaced and was fixed**: enabling Flyway's `db/reference` location broke
   user-service's entire test suite (`UserManagementApplicationTests` and everything downstream of
   it — 31 cascading errors). Root cause: `src/test/resources/application.yml` fully replaces the
   main config for the test classpath and had no `spring.flyway` override; Flyway defaults to
   enabled once its dependency is on the classpath, and it tried to run the plain-Postgres
   migrations (`uuid`, `jsonb`, `gen_random_uuid()`) against the H2 in-memory test database. Tests
   still use `ddl-auto: create-drop` + `spring.sql.init` + their own `data.sql` — moving them onto
   real Postgres via Testcontainers so they exercise the actual Flyway migrations is Phase 4's job,
   not this one — so the fix here was narrowly `spring.flyway.enabled: false` in the test
   `application.yml`, leaving the existing H2 test setup untouched. Full suite verified green
   afterward: 218 tests, 0 failures, 0 errors.
5. **Verified** (packaged jar, both scenarios): a second boot with no changes left counts
   unchanged (6/28/56) and Flyway skipped the repeatables entirely (unchanged checksum, no
   "Migrating schema" log lines) — confirming idempotency both structurally (`ON CONFLICT`) and via
   Flyway's own skip logic. A fully fresh, empty `busmate_user` database ran the complete chain
   (`V001` → `V002` → `R__001` → `R__002` → `R__003`) in one boot and produced identical counts.

### Phase 3 — Rebuild demo seed (Tier 3) — ✅ complete (2026-07-17)

1. ~~Discard the stale 394-line `core-service/data.sql`~~ Done — removed (`git rm`); it was
   already inert (`spring.sql.init.mode: never`). `core-service/schema.sql` (triggers) is left
   alone — unrelated to seed data, still slated for Phase 5.
   Rewrote the Sri Lankan demo dataset from the *current* entities: three real bus operators
   (Lanka Suwaseriya Travels — PRIVATE, Western Province; Southern Comfort Express — PRIVATE,
   Southern Province; SLTB – Central Province — CTB), each running one of three real routes
   (Colombo Fort ↔ Kandy, ↔ Galle via the Southern Expressway, ↔ Negombo) across 9 real Sri Lankan
   stops with realistic distances/timetables, 6 buses (real models: TATA LP 1613, Ashok Leyland
   Viking, Rosa Coaster, Yutong ZK6122), permits, daily schedules, and trips (yesterday/today,
   `CURRENT_DATE`-relative so the data never goes stale); plus the admin/MOT/timekeeper/conductor/
   passenger accounts needed to exercise every RBAC role from Phase 2, and demo fares/tickets/
   transactions in ticketing-service. Reused names/plates/permit numbers from the pre-Flyway
   `scripts/seed-operator-conductor-profiles.sh` and its credentials doc where they overlapped,
   for continuity. All UUIDs allocated in `docs/dev-seed-contract.md` first, per its own rule.
   Password hashes are real bcrypt (10 rounds, generated to match `PasswordConfig`'s
   `BCryptPasswordEncoder`) — every demo account logs in for real, verified via actual
   `POST /api/auth/login` calls against a running instance (success cases *and* a wrong-password
   401), not just inspected in the database.
2. Ordering across services (user-service demo users/operators → core-service
   operators/routes/schedules → ticketing fares/demo tickets) held as designed — core-service's
   `operator.user_id` and ticketing-service's loosely-coupled `bus_id`/`trip_id`/`passenger_id`/
   `conductor_id` text columns all reference the contract's shared UUIDs correctly.
3. ~~Make each migration idempotent (`ON CONFLICT DO NOTHING`)~~ Done, but with an important
   correction to the tier's own file-naming convention for any service that has **both** a
   reference tier and a seed tier: **Flyway always applies every pending versioned (`V`) migration
   across all configured locations before any repeatable (`R`) one, regardless of version
   number.** A versioned `V900__demo_users.sql` in user-service therefore ran *before*
   `R__001_user_types.sql` populated the very `user_types` lookup its `user_type_id` subqueries
   depend on — caught the hard way ("null value in column user_type_id violates not-null
   constraint" against a genuinely empty database). Fixed by authoring user-service's three demo
   files as **repeatable** (`R__900_demo_users.sql`, `R__901_demo_credentials.sql`,
   `R__902_demo_user_profiles.sql`) instead, so they sort into the same repeatable batch after
   `R__001`–`003` by filename. core-service and ticketing-service have no reference tier, so their
   `V900+` demo files never hit this hazard and were kept versioned as originally planned. Two
   more real gaps found the same way: `user_type_permissions` had no natural-key unique
   constraint for its `ON CONFLICT` target (fixed with a proper schema migration,
   `V002__add_user_type_permissions_unique_constraint.sql`, in Phase 2 territory but only surfaced
   once Phase 3 tried to insert against it) and `auth_credentials.failed_attempts` has only a
   Java-side `@Builder.Default`, no DB-level `DEFAULT`, so the raw SQL insert had to supply `0`
   explicitly.
   Verified for all three services with a packaged jar: a completely fresh, empty database runs
   the full chain in the correct order and produces the exact expected row counts (12 users/12
   credentials/12 profiles; 3 operators/9 stops/3 route groups/6 routes/22 route stops/6 buses/3
   permits/6 assignments/6 schedules/6 calendars/22 schedule stops/12 trips; 5 base fares/6 route
   fares/6 transactions/3 cash/3 online/6 tickets), and a second no-op boot leaves every count
   unchanged (Flyway skips already-applied versioned migrations and unchanged-checksum repeatables
   — confirmed idempotent both structurally, via `ON CONFLICT`, and via Flyway's own skip logic).
4. ~~Keep the resulting login list documented~~ Done:
   [`docs/dev-seed-credentials.md`](../dev-seed-credentials.md), successor to
   `docs/operator-conductor-seed-credentials.md` (kept for history).

**Also checked (not a regression):** the full test suites for core-service (18 errors) and
ticketing-service (1 error) fail identically with or without this phase's changes — their
`application-test.yml`/equivalent hardcodes a personal machine's local Postgres
(`localhost:5432`, user `kavinda`) that doesn't exist in this environment, confirmed by checking
out the pre-Phase-3 commit and re-running the same suites. Pre-existing, out of scope here; Phase
4 ("Switch integration tests to Testcontainers Postgres") is where this gets fixed for real.
user-service's suite (218 tests) is unaffected and green throughout — its test config was already
corrected in Phase 2.

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
3. **Delete remaining stale artifacts:** `core-service/schema.sql` and all `spring.sql.init` config
   (`core-service/data.sql` and the `db/migration/README.md`/`V00x` files were already removed in
   Phases 1 and 3). Update or retire the stale `docs/database-management-guide.md` /
   `docs/database-reset-and-seed-guide.md`.

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
