# 01 — Current-State Assessment

> Part of [`system-model-and-documentation-sync`](./README.md). Evidence-based; every claim cites a real path.

## 1. Monorepo architecture

**Orchestration:** Nx ([nx.json](../../nx.json)) + pnpm workspaces
([pnpm-workspace.yaml](../../pnpm-workspace.yaml)), `pnpm@10.26.1`, Node `>=20`. Root scripts in
[package.json](../../package.json) expose `dev:*`, `build:*`, `test`, `lint`, `affected:*`,
`graph`, `e2e*`, `seed:*`, `apk:*`.

**Projects (with Nx tags — already a partial system model):**

| Project | Path | Stack | Nx tags |
|---------|------|-------|---------|
| core-service | [apps/backend/core-service](../../apps/backend/core-service) | Spring Boot / Java / Maven | `scope:backend,type:app,framework:spring-boot,lang:java` |
| user-service | [apps/backend/user-service](../../apps/backend/user-service) | Spring Boot / Java / Maven | (same family) |
| ticketing-service | [apps/backend/ticketing-service](../../apps/backend/ticketing-service) | Spring Boot / Java / Maven | (same family) |
| api-gateway | [apps/backend/api-gateway](../../apps/backend/api-gateway) | Node/Express/TS | pnpm workspace member |
| new-react-portal | [apps/frontend/new-react-portal](../../apps/frontend/new-react-portal) | Vite/React | `@busmate/new-react-portal` |
| passenger-web | [apps/frontend/passenger-web](../../apps/frontend/passenger-web) | Next.js | — |
| conductor-mobile | [apps/frontend/conductor-mobile](../../apps/frontend/conductor-mobile) | Expo/React Native | — |
| passenger-mobile | [apps/frontend/passenger-mobile](../../apps/frontend/passenger-mobile) | Expo/React Native | — |
| ui | [libs/ui](../../libs/ui) | shadcn component lib | `scope:shared,type:lib,lang:typescript` |
| api-client-core/user/ticketing/location | [libs/api-clients/*](../../libs/api-clients) | generated TS clients | `scope:shared,type:lib,lang:typescript` |

**Runtime topology:** [docker-compose.yml](../../docker-compose.yml) runs `api-gateway`,
`user-service`, `core-service`, `ticketing-service`. Prod variant
[docker-compose.production.yml](../../docker-compose.production.yml) and E2E variant
[docker-compose.e2e.yml](../../docker-compose.e2e.yml) exist. Databases are external **Supabase
Postgres** (per memory: core-service and user-service point at *different* Supabase projects).
Secrets are centralized in [config/secrets/.env](../../config/secrets) (spring-dotenv +
`env_file`).

**Domain shape (core-service):** DDD-ish packages under
`com/busmate/routeschedule/` — `fleet`, `licensing`, `network`, `operations`, `passengerinfo`,
`scheduling`, `shared`, each with `controller/dto/entity/enums/repository/service` (+ `mapper` via
MapStruct).

## 2. Languages, frameworks, tooling

- **Backend:** Java + Spring Boot + Maven (`./mvnw`), **MapStruct** (DTO mapping), **springdoc-openapi**
  (all 3 services expose `/v3/api-docs` + Swagger UI). Nx wraps Maven via `nx:run-commands`
  ([core-service/project.json](../../apps/backend/core-service/project.json): `build`, `test`,
  `package`, `serve`, `serve:local`, `serve:prod`).
- **Gateway:** Express + `http-proxy-middleware`, `helmet`, `jsonwebtoken`, Jest tests. Routing model
  in [apps/backend/api-gateway/src/config/routes.config.ts](../../apps/backend/api-gateway/src/config/routes.config.ts);
  BFF (httpOnly-cookie auth) in `src/bff/`.
- **Frontend:** Next.js, Vite, Expo; shared shadcn `libs/ui` (Storybook via `ui:storybook`).
- **Codegen:** `openapi-typescript-codegen` + [scripts/post-generate-api-client.mjs](../../scripts/post-generate-api-client.mjs).
- **Testing:** JUnit (Maven `test`), Jest (gateway), **Playwright** E2E
  ([playwright.config.ts](../../playwright.config.ts), `tests/e2e`).
- **Messaging:** Kafka — `user-service` only (`UserEventPublisher`, topic `user-events`,
  `UserEventKafkaConfig`, `OperatorProducer`).

## 3. Existing sources of truth (as-is)

| Concern | De-facto authoritative source today | Notes |
|---------|-------------------------------------|-------|
| HTTP API shape | Spring controllers + DTOs (springdoc reflects them) | **Code-first.** Spec generated at runtime, not committed. |
| API clients | `libs/api-clients/*/src` (generated, **committed**) | Also duplicated into 2 mobile apps. |
| Gateway routing | [routes.config.ts](../../apps/backend/api-gateway/src/config/routes.config.ts) | Hand-maintained; no cross-check vs service specs. |
| DB schema | JPA entities + Hibernate `ddl-auto: update` | **Code-first, applied at boot.** Drift-prone. |
| DB migrations | 3 SQL files in [core-service .../db/migration](../../apps/backend/core-service/src/main/resources/db/migration) | **Not executed** — no Flyway dependency. Plus `schema.sql`/`data.sql`. |
| Events | Java publisher code | No schema/contract. |
| Permissions/roles | user-service (`PermissionsController`, `@RequiresPermission`, DB rows) | Per memory: JWT principal = userId. |
| Architecture | Prose Markdown + ad-hoc Mermaid | No model-as-code. |
| Workflows | Prose in [docs/route-network-and-operations/workflows](../../docs/route-network-and-operations/workflows) | Human-authored; no IDs, no code links. |
| Ops/run | [docs/busmate-platform-run-guide.md](../../docs/busmate-platform-run-guide.md), Makefile, compose | — |
| Decisions | Long plan docs in [docs/plans](../../docs/plans); user memory (`~/.claude/.../MEMORY.md`) | No ADR format. |

## 4. Existing documentation and diagrams

Strong prose culture already:

- [docs/system-capability-audit/](../../docs/system-capability-audit) — directory-per-section
  framework (current-state/workflows/capabilities/gaps/backlog), traceability C←G←I.
- [docs/transit-workflow-evaluation/](../../docs/transit-workflow-evaluation) — 8-stage pipeline eval.
- [docs/route-network-and-operations/](../../docs/route-network-and-operations) — routes, stops,
  schedules, trips + a `workflows/` subdir.
- [docs/passenger-information/](../../docs/passenger-information), [docs/architecture-review/](../../docs/architecture-review).
- Mermaid is already used inside several of these `.md` files (grep-confirmed).

**Gap:** all diagrams are hand-drawn inside prose and can silently drift from code. There is no
generated diagram anywhere.

## 5. Existing code generation

Only one generator exists: **OpenAPI → TS client**. It is **code-first but source-unstable** — the
`generate:local`/`generate:cloud` targets read `/v3/api-docs` from a *running* server (localhost or a
hard-coded `18.140.161.237`). `generate:spec` can read a committed
`libs/api-clients/<name>/specs/openapi.json`, but those spec files are only produced ad-hoc by
`fetch-spec:local` and are not consistently committed or versioned.

## 6. Existing CI validation

**None.** `.github/workflows/` does not exist / is empty. There are Copilot instruction files
([.github/instructions/*.instructions.md](../../.github/instructions)) and unrelated
`.github/java-upgrade` and `.github/modernize` tool scaffolding, but **no pipeline runs on push/PR**.
There are also **no git hooks** (no `.husky`, no `lint-staged`, no `prepare` script).

## 7. Current gaps

- **G1 No CI** → nothing is validated automatically.
- **G2 No committed/versioned API contracts** → no breaking-change detection; clients regenerated from
  whatever a live server currently returns.
- **G3 Database managed by `ddl-auto: update`** on all services → schema is emergent, unversioned, and
  can destructively reconcile; the 3 core-service migration files are dead code.
- **G4 No event contracts** → `user-events` consumers can break silently.
- **G5 No architecture model as code** → diagrams drift.
- **G6 No structured workflow model** → workflow docs are prose only, no code linkage, no perspectives.
- **G7 No `AGENTS.md`** / fragmented agent guidance (`.agents`, `.codex` empty; `.github/instructions`
  scoped to 2 frontends only).
- **G8 No CODEOWNERS / ownership metadata** for docs or contracts.

## 8. Current duplication (must not be worsened)

- **API clients duplicated**: [libs/api-clients/*](../../libs/api-clients) **and** copies in
  [apps/frontend/passenger-mobile/lib/api-client/](../../apps/frontend/passenger-mobile/lib/api-client)
  and [conductor-mobile/src/lib/api-client/](../../apps/frontend/conductor-mobile/src/lib/api-client).
- **DDL described twice** in core-service: `schema.sql` + `db/migration/V00x` + live `ddl-auto`.
- **Facts restated in prose**: endpoint lists, role capabilities, and entity fields are re-typed in
  `docs/route-network-and-operations/*.md` and the capability audit — these will drift from code.

## 9. Current drift risks (ranked)

1. **API drift** (clients vs live servers vs consumers) — high frequency, high blast radius.
2. **DB drift** (`ddl-auto` vs any written migration vs data dictionary) — high severity.
3. **Diagram drift** (Mermaid in prose) — medium, silent.
4. **Doc-fact drift** (endpoint/role tables in prose) — medium, already happening.
5. **Event drift** — currently low volume (one topic) but zero protection.

## 10. What can be reused vs replaced

**Reuse:** springdoc, `openapi-typescript-codegen`, `post-generate-api-client.mjs`, Nx tags +
`affected`, the docs directory conventions (directory-per-topic, traceability), `tools/api-usage-analyzer`,
existing Mermaid literacy, `config/secrets` secret model, Playwright harness.

**Replace / retire:** dead `schema.sql`/`V00x` files superseded by a real Flyway baseline; live-server
spec fetching as the *primary* generation input (keep as a convenience); duplicated mobile API clients
(consolidate onto `libs/api-clients/*` later).

## 11. Repository-specific observations

- `ddl-auto: update` is set in **all three** `application.yml` files — this is the single biggest
  correctness/ops risk and the hardest thing to change safely (live Supabase DBs).
- The api-gateway `routes.config.ts` is an *independent* second description of every service's public
  surface — a natural place to add a spec-vs-route consistency check later.
- Nx `release` is configured for the 4 app projects with `conventionalCommits`
  ([nx.json](../../nx.json)) — conventional commits are therefore already an available signal for
  breaking-change/versioning automation.
- Memory records that mobile apps historically hit `ticketing-service` directly by IP with plain-text
  parsing — an extra, undocumented contract surface to capture eventually.

Continue to [02-target-architecture.md](./02-target-architecture.md).
