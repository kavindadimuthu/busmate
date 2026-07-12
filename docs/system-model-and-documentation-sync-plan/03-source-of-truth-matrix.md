# 03 — Source-of-Truth Matrix

> Part of [`system-model-and-documentation-sync`](./README.md). The contract that prevents duplicate sources of truth.

**Legend — Generation direction:** `code→spec` = code-first (spec frozen from code); `spec→code` =
spec-first (code/clients generated from spec); `model→docs` = model renders to docs; `manual` = hand-authored.
**Editable-by-AI** applies to the *authoritative* artifact only; generated outputs are never editable by anyone.

## APIs & contracts

| Concern | Current source | Proposed authoritative source | Derived artifacts | Validation | Owner | Human-edit | AI-edit | Direction | Breaking-change policy | Drift detection |
|---|---|---|---|---|---|---|---|---|---|---|
| HTTP API (per service) | live `/v3/api-docs` | `apps/backend/<svc>/contracts/openapi.json` (committed springdoc output) | `libs/api-clients/*`, `docs/generated/api/*` | rebuild-and-diff + JSON Schema | service team | ✗ (edit controllers instead) | ✗ | `code→spec` | `oasdiff` blocks removed/renamed ops & shrunk types | freshness diff vs rebuilt spec |
| Gateway routing | [routes.config.ts](../../../apps/backend/api-gateway/src/config/routes.config.ts) | same (kept) | — | consistency check vs service specs (advisory) | gateway team | ✓ | ✓ | `manual` | manual review | route-vs-spec cross-check |
| TS API clients | committed generated code | *(derived only)* | — | regenerate-and-diff | shared | ✗ | ✗ | `spec→code` | inherited from spec | freshness diff |
| Duplicated mobile clients | copies in apps | *(retire → use libs)* | — | — | mobile teams | ✗ | ✗ | `spec→code` | — | flagged for consolidation |

## Events & messaging

| Concern | Current | Proposed authoritative | Derived | Validation | Owner | Human | AI | Direction | Breaking policy | Drift |
|---|---|---|---|---|---|---|---|---|---|---|
| `user-events` topic | Java publisher code | `contracts/events/asyncapi.yaml` + `schemas/user-event.schema.json` | event catalog HTML, (later) typed publisher/consumer | AsyncAPI validate + JSON Schema | user-service team | ✓ | ✓ (schema) | `spec→code` (message shape) | additive-only; removed field/renamed event blocks | publisher payload validated against schema in tests |
| Topic/queue inventory | ad-hoc constants | `asyncapi.yaml` `channels` | messaging section of arch docs | AsyncAPI validate | user-service team | ✓ | ✓ | model | review | manual |

## Database & data

| Concern | Current | Proposed authoritative | Derived | Validation | Owner | Human | AI | Direction | Breaking policy | Drift |
|---|---|---|---|---|---|---|---|---|---|---|
| Schema/DDL | JPA + `ddl-auto: update` | **Flyway** migrations `apps/backend/<svc>/.../db/migration/` | ER diagram, data dictionary (`docs/generated/db/<svc>/`) | Flyway validate + regen-and-diff | service team | ✓ (write migration) | proposal-only | `migration-first` | expand/contract; no destructive drop without ADR | live schema vs migrations diff |
| ORM entities | JPA entities | entities (kept, aligned to migrations) | — | boot with `validate` (not `update`) | service team | ✓ | ✓ | `code↔migration` reconciled by review | entity change without migration = fail | Hibernate `validate` mismatch |
| Entity relationships | implicit FKs | migrations + entity annotations | ER diagram | ER regen | service team | ✓ | ✓ | model→docs | — | ER diff |
| Data dictionary | none | generated from schema + `docs/db/<svc>/columns.md` annotations | `docs/generated/db/*` | regen-and-diff | data owner | annotations only | annotations | model→docs | — | diff |
| Data ownership / lineage | tribal | `docs/db/ownership.md` (which service owns which table) | arch docs | link/CODEOWNERS | architects | ✓ | ✓ | manual | review | manual |
| Retention / deletion | undocumented | `docs/db/retention.md` | — | manual | data owner | ✓ | ✓ | manual | review | manual |
| Sensitive-data class. | undocumented | tags in data dictionary (`pii`, `secret`) | security docs | lint tags present | security owner | ✓ | ✓ | manual | review | manual |

## Workflows & behaviour

| Concern | Current | Proposed authoritative | Derived | Validation | Owner | Human | AI | Direction | Breaking policy | Drift |
|---|---|---|---|---|---|---|---|---|---|---|
| Workflows (multi-perspective) | prose in `docs/route-network-and-operations/workflows` | `docs/workflows/<id>.workflow.yaml` | per-perspective Mermaid, narrative MD | schema validate + anchor resolution | domain owner | ✓ | ✓ | model→docs | ID-stable; steps additive | anchors (endpoint/entity/event IDs) must resolve to real code |
| State machines | implicit in enums/services | `states:` block in workflow YAML | state Mermaid | schema validate | domain owner | ✓ | ✓ | model→docs | — | enum cross-check (advisory) |
| Business rules | code + prose | `rules:` block referencing code anchors | narrative | anchor resolution | domain owner | ✓ | ✓ | model→docs | — | anchor check |
| Failure/async/retry | prose | perspective sections in workflow YAML | failure Mermaid | schema validate | domain owner | ✓ | ✓ | model→docs | — | manual |

## Security & access

| Concern | Current | Proposed authoritative | Derived | Validation | Owner | Human | AI | Direction | Breaking policy | Drift |
|---|---|---|---|---|---|---|---|---|---|---|
| AuthN | api-gateway BFF + JWT (`src/bff/`, `middleware/auth.middleware.ts`) | code + `docs/security/authn.md` | security section of arch | manual | security owner | ✓ | ✓ | code-first + manual | review | manual |
| AuthZ / permissions | user-service (`@RequiresPermission`, DB rows) | code + exported `contracts/permissions.json` snapshot | permission matrix doc | export-and-diff | user-service team | ✗ (change code) | ✗ | `code→spec` | removing a permission = review | snapshot diff |
| Roles | DB + `bff/roles.ts` | same | role→capability matrix (from permissions export) | export-and-diff | user-service team | ✓ | ✓ | code→spec | review | diff |
| Trust boundaries | implicit | Structurizr `workspace.dsl` (boundaries) + `docs/security/trust-boundaries.md` | C4 diagrams | arch validate | architects | ✓ | ✓ | model→docs | review | manual |
| Audit / sensitive flows | partial | `docs/security/*.md` + data-dictionary tags | — | manual | security owner | ✓ | ✓ | manual | review | manual |

## Architecture, ops, decisions

| Concern | Current | Proposed authoritative | Derived | Validation | Owner | Human | AI | Direction | Breaking policy | Drift |
|---|---|---|---|---|---|---|---|---|---|---|
| System/context/container/component | prose Mermaid | `docs/architecture/model/workspace.dsl` (Structurizr) | C4 Mermaid/PNG | Structurizr validate | architects | ✓ | ✓ | model→docs | review | render-and-diff |
| Service dependencies | Nx graph (implicit) | Structurizr relationships (cross-checked vs Nx graph) | dependency diagram | nx graph vs dsl (advisory) | architects | ✓ | ✓ | model→docs | review | cross-check |
| Deployment/runtime | `docker-compose*.yml`, Makefile | compose files (kept) + `docs/operations/deployment.md` | deployment view in DSL | compose lint (advisory) | ops | ✓ | ✓ | code-first + manual | review | manual |
| Config/env | `config/secrets/.env.example` | `.env.example` + `docs/operations/configuration.md` | — | example-vs-usage lint (advisory) | ops | ✓ | ✓ | manual | review | manual |
| Monitoring/alerts/SLO/runbooks/backup/incident | mostly absent | `docs/operations/*.md` | — | link check | ops | ✓ | ✓ | manual | review | manual |
| ADRs / decisions | plan docs + memory | `docs/adr/NNNN-*.md` (MADR) | ADR index | link check + status lint | architects | ✓ | ✓ | manual | superseded-by links | manual |
| Glossary / terminology | scattered | `docs/glossary.md` | — | link check | architects | ✓ | ✓ | manual | review | manual |
| Known limitations / tech debt | memory + audit docs | `docs/tech-debt.md` (+ audit backlog) | — | link check | leads | ✓ | ✓ | manual | review | manual |

## Rules enforced by this matrix

1. **No fact appears as authoritative in two rows.** Prose that restates code facts (endpoint tables,
   role capabilities, entity fields in `docs/route-network-and-operations/*`) becomes *generated* or
   *links to* the authoritative artifact — it stops being independently maintained.
2. **Generated ≠ editable.** Any row whose direction is `spec→code` / `model→docs` produces
   DO-NOT-EDIT files.
3. **Reverse (doc→code) is proposal-only** for DB and permissions (the rows marked "proposal-only").

Continue to [04-repository-structure-plan.md](./04-repository-structure-plan.md).
