# 00 — Executive Summary

> Part of the plan set in [`docs/plans/system-model-and-documentation-sync/`](./README.md).
> Planning only. No implementation is performed by this document set.

## Objective

Introduce a **synchronized code / specification / diagram / documentation system** for the
BusMate monorepo so that:

- Backend services, API contracts, event schemas, database models, workflows, and docs stay in sync.
- Every important fact has a single **authoritative source**.
- Derived docs and diagrams are **generated**, not hand-maintained in parallel.
- Code/spec changes trigger **validation, regeneration, drift detection, and impact analysis** in CI.
- Doc-implied code changes are handled through **reviewed proposals**, never uncontrolled rewrites.
- Humans, AI agents, VS Code, CI, and doc tooling all collaborate on the same substrate — and the
  system remains fully operable **by hand, without AI**.

## Current repository situation (evidence-based)

BusMate is an **Nx + pnpm** monorepo (`pnpm@10.26.1`, `nx ^21`, [nx.json](../../nx.json),
[pnpm-workspace.yaml](../../pnpm-workspace.yaml)) containing:

- **3 Spring Boot / Java / Maven services**: [core-service](../../apps/backend/core-service)
  (14 controllers, 14 entities), [user-service](../../apps/backend/user-service) (8 controllers),
  [ticketing-service](../../apps/backend/ticketing-service) (3 controllers).
- **1 Node/Express TypeScript** [api-gateway](../../apps/backend/api-gateway) with a BFF module.
- **5 frontends**: `management-portal` (Next.js), `new-react-portal` (Vite), `passenger-web`
  (Next.js), `conductor-mobile` + `passenger-mobile` (Expo).
- **Shared libs**: [libs/ui](../../libs/ui) (shadcn), [libs/api-clients/*](../../libs/api-clients)
  (4 generated OpenAPI clients).

What already exists and can be **reused as a foundation**:

- **API code-gen pipeline**: springdoc OpenAPI on each Spring service → `openapi-typescript-codegen`
  → `libs/api-clients/*`, post-processed by
  [scripts/post-generate-api-client.mjs](../../scripts/post-generate-api-client.mjs). Nx targets
  `generate:local|cloud|spec` and `fetch-spec:local` exist per client
  ([route-management/project.json](../../libs/api-clients/core-service/project.json)).
- **Nx project graph + tags** (`scope:*`, `type:*`, `framework:*`, `lang:*`) — a ready-made
  service/dependency model and `affected` engine.
- **Extensive prose docs** under [docs/](../../docs) (system-capability-audit, transit-workflow-evaluation,
  route-network-and-operations, passenger-information) already using Mermaid.
- **Copilot-style instructions** under [.github/instructions/](../../.github/instructions).
- **Custom tooling** in [tools/](../../tools) (api-usage-analyzer, dev-portal).

The critical gaps (detailed in [01-current-state-assessment.md](./01-current-state-assessment.md)):

- **No CI at all** — `.github/workflows/` is empty. Nothing validates, regenerates, or gates anything.
- **OpenAPI specs are not committed authoritatively** — they are fetched at generate-time from
  *live running servers* (`localhost:9010`, a hard-coded cloud IP). No spec is versioned, so no
  breaking-change detection is possible.
- **Database is code-first via `ddl-auto: update`** on all 3 services — schema drift and
  destructive-change risk; only core-service has 3 partial Flyway-style `V00x` SQL files, and
  **Flyway is not even a dependency**, so those migrations do not run.
- **Events are code-only** (`user-events` topic, `UserEventPublisher`) with no schema/contract.
- **No architecture model as code** — only ad-hoc Mermaid in prose that drifts silently.
- **Duplicated API clients** — copies live in both `libs/api-clients/*` and inside
  `passenger-mobile`/`conductor-mobile`.
- **No `AGENTS.md`** at root; agent guidance is fragmented across `.github/instructions`, memory,
  and empty `.agents`/`.codex` dirs.

## Recommended overall approach

A **contract-anchored, code-first-where-code-already-leads** model, rolled out in small reversible
phases. We do **not** flip the repo to specification-first everywhere. Instead:

1. **Freeze the existing strengths into authoritative artifacts.** Commit OpenAPI specs
   (`apps/backend/*/contracts/openapi.json`) as build outputs of each Spring service so specs become
   diffable, versioned, and gate-able — without changing the code-first authoring model.
2. **Add the missing contract layer for events** with **AsyncAPI + JSON Schema** for `user-events`.
3. **Make the database model explicit** by introducing Flyway *properly* and generating an ER
   data-dictionary from the committed schema (addressing the `ddl-auto` risk over time).
4. **Introduce one machine-readable architecture model** — **Structurizr DSL** — as the single source
   for C4 context/container/component diagrams, replacing hand-drawn Mermaid where it drifts.
5. **Introduce a structured, multi-perspective workflow schema** (YAML) with a pilot on the existing
   **Trip lifecycle** ([docs/route-network-and-operations/trips.md](../../docs/route-network-and-operations/trips.md)).
6. **Wire everything into CI (new)** as freshness + drift + breaking-change gates, using Nx `affected`
   to keep it fast.
7. **Formalize AI-agent operation** with a root `AGENTS.md` that points agents at authoritative sources
   and forbids editing generated outputs.

The unifying rule: **one fact, one source; everything else is generated and marked as such.** See the
full matrix in [03-source-of-truth-matrix.md](./03-source-of-truth-matrix.md).

## Most important architectural decisions

| # | Decision | Recommendation | Doc |
|---|----------|----------------|-----|
| D1 | API source of truth | **Code-first**, but *commit* the generated OpenAPI spec as the versioned contract | [02](./02-target-architecture.md), [06](./06-generation-and-synchronization-plan.md) |
| D2 | Event contracts | Add **AsyncAPI + JSON Schema** (spec-first for the message shape) | [03](./03-source-of-truth-matrix.md) |
| D3 | Database | Adopt **Flyway** as authoritative DDL; move off `ddl-auto: update` gradually; generate ER docs | [03](./03-source-of-truth-matrix.md), [11](./11-risks-and-tradeoffs.md) |
| D4 | Architecture diagrams | **Structurizr DSL** as the one architecture model; render to Mermaid/images | [02](./02-target-architecture.md) |
| D5 | Workflows | New **YAML workflow schema** with per-perspective projections | [05](./05-workflow-and-perspective-model.md) |
| D6 | Reverse (doc→code) | Never auto-apply. Produce a **proposal artifact** + issue/PR draft for humans | [06](./06-generation-and-synchronization-plan.md) |
| D7 | Agent contract | Root **`AGENTS.md`** + generated-file headers as the guardrail | [08](./08-ai-agent-operating-model.md) |

## Expected benefits

- Breaking API/event changes are caught **before merge**, not by a broken mobile app in production.
- New engineers and AI agents read one map instead of reverse-engineering 4 services.
- Diagrams and data dictionaries stop lying (they are regenerated or CI fails).
- Impact analysis ("who consumes this endpoint/event?") becomes a command, building on the existing
  [tools/api-usage-analyzer](../../tools/api-usage-analyzer).

## Major risks (see [11-risks-and-tradeoffs.md](./11-risks-and-tradeoffs.md))

- **Tooling sprawl** — mitigated by the *smallest coherent toolset* (OpenAPI, AsyncAPI+JSON Schema,
  Flyway, Structurizr, Mermaid, Markdown — and nothing else).
- **`ddl-auto: update` vs Flyway conflict** — must be sequenced carefully to avoid a destructive
  schema reconciliation on shared Supabase Postgres DBs.
- **Slow CI** — mitigated by Nx `affected` scoping.
- **Adoption** — mitigated by keeping every generator a plain `pnpm`/`nx` command runnable by hand.

## Estimated implementation complexity

**Medium overall**, front-loaded. The API and Nx foundations already exist, so Phases 1–3 are low
effort/high value. The genuinely hard part is **D3 (database)** — decoupling from `ddl-auto: update`
on live Supabase databases is the one place with production risk and should be the slowest phase.

## Recommended implementation sequence

1. **Inventory + authority classification** (this plan → a committed manifest).
2. **Docs index + ownership** (`CODEOWNERS`, `AGENTS.md`, generated-file headers).
3. **API contract freeze + breaking-change gate** (commit specs, add `oasdiff` in new CI).
4. **Database documentation generation** (ER + data dictionary from schema; Flyway groundwork).
5. **One pilot workflow** (Trip lifecycle) with generated perspective diagrams.
6. **Architecture model** (Structurizr).
7. **Drift detection + CI enforcement** promoted from advisory to blocking.
8. **AI-agent integration hardening.**
9. **Broader rollout** (events, remaining workflows, retire duplicated clients).

Full detail in [10-implementation-roadmap.md](./10-implementation-roadmap.md).

## Non-goals

No generators, dependencies, CI, SDKs, schema changes, migrations, or refactors are created by this
task. Only the planning `.md` files in this directory are added.
