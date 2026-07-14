# 04 — Repository Structure Plan

> Part of [`system-model-and-documentation-sync`](./README.md). Proposed layout only — **nothing is created by this task.**

## Guiding rules

- Reuse existing directories ([docs/](../../docs), [tools/](../../tools),
  [apps/backend/<svc>/src/main/resources/db/migration](../../apps/backend/core-service/src/main/resources/db/migration),
  [libs/api-clients/*](../../libs/api-clients)) before inventing new ones.
- **Authoritative** sources live next to the code they describe (service-local) *or* in a single
  cross-cutting home under `docs/`. **Generated** outputs live under `docs/generated/` (single, easy to
  `.gitignore`-or-verify, easy for agents to recognize).
- Naming: kebab-case dirs, stable IDs, `*.workflow.yaml`, `openapi.json`, `asyncapi.yaml`, `NNNN-*.md`
  for ADRs. Matches existing conventions in [.github/instructions](../../.github/instructions).

## New directories & files (proposed)

```
apps/backend/<svc>/contracts/
  openapi.json                 # committed springdoc output (authoritative frozen contract)
apps/backend/user-service/contracts/events/
  asyncapi.yaml                # authoritative event contract
  schemas/user-event.schema.json
apps/backend/<svc>/src/main/resources/db/migration/
  V###__*.sql                  # Flyway (core already has 3; extend + adopt Flyway dep)

docs/
  architecture/
    model/workspace.dsl        # Structurizr DSL (authoritative architecture)
    README.md
  workflows/
    trips.workflow.yaml        # pilot (authoritative workflow model)
    _schema/workflow.schema.json
  adr/
    0001-record-architecture-decisions.md
    0002-api-contract-freeze.md    # (examples of format only)
  db/
    ownership.md               # table→owning-service map (authoritative, manual)
    retention.md
    <svc>/columns.md           # per-column annotations (pii/secret/description)
  security/
    authn.md  authz.md  trust-boundaries.md
  operations/
    deployment.md  configuration.md  monitoring.md  runbooks.md  incident.md
  glossary.md
  tech-debt.md
  generated/                   # <-- ALL generated outputs; DO NOT EDIT; headerized
    INDEX.md                   # manifest: file → source → regen command → hash
    api/<svc>/index.md
    db/<svc>/er.mmd  db/<svc>/data-dictionary.md
    architecture/context.mmd container.mmd component-<svc>.mmd
    workflows/trips/{user,system,data,state,failure,security,ops}.mmd
    events/user-events.md
  proposals/                   # reverse (doc→code) proposals, human-reviewed
    <id>.md

tools/
  contracts/    (check-openapi-fresh, oasdiff-wrapper, check-events)
  db/           (gen-er, gen-dictionary, check-schema-docs-fresh)
  arch/         (render-structurizr, validate)
  workflows/    (validate, render-mermaid)
  gen/          (orchestrator + headerize + hash)

.github/
  workflows/    (ci.yml, contracts.yml, docs.yml — NEW; none today)
  CODEOWNERS

AGENTS.md                      # root agent contract (NEW)
apps/backend/<svc>/AGENTS.md   # optional service-scoped agent notes
```

## Existing files to reuse (not move now)

- [scripts/post-generate-api-client.mjs](../../scripts/post-generate-api-client.mjs) — kept as the
  client post-processor; called by the new generation orchestrator.
- [libs/api-clients/*/project.json](../../libs/api-clients/route-management/project.json) — add a
  `generate` target that reads the **committed** `contracts/openapi.json` (via the existing
  `generate:spec` pattern) instead of a live server.
- [core-service .../db/migration/V001..V003](../../apps/backend/core-service/src/main/resources/db/migration)
  — become the tail of a proper Flyway history after a `V000` baseline is introduced.
- [tools/api-usage-analyzer](../../tools/api-usage-analyzer) — extended for impact analysis.
- Existing prose docs — kept, but endpoint/role/entity tables converted to links or generated includes.

## Files that may eventually move (later, not now)

- Duplicated mobile API clients
  ([passenger-mobile/lib/api-client](../../apps/frontend/passenger-mobile/lib/api-client),
  [conductor-mobile/src/lib/api-client](../../apps/frontend/conductor-mobile/src/lib/api-client)) →
  consolidate onto `libs/api-clients/*`.
- Dead [core-service schema.sql](../../apps/backend/core-service/src/main/resources/schema.sql) →
  retired once Flyway baseline exists.

## Generated-output location policy

- **Single root:** everything generated lives under `docs/generated/**` (docs) or `libs/api-clients/**`
  (clients). This makes the DO-NOT-EDIT boundary a one-line glob for agents, CODEOWNERS, and CI.
- **Committed, not ignored.** Generated files are committed so diffs are reviewable and CI can do
  regenerate-and-diff freshness checks. (Alternative — gitignore + generate-in-CI — is rejected in
  [12](./12-open-questions-and-decisions.md) because it hides drift from reviewers.)

## Naming & versioning conventions

- Contracts: `openapi.json` / `asyncapi.yaml` per service; version carried inside the document
  (`info.version`), bumped via existing `conventionalCommits` signal already configured in
  [nx.json](../../nx.json) `release`.
- Workflows: `<domain-id>.workflow.yaml`; step IDs `WF-<DOMAIN>-<n>`; never renumber (append/deprecate).
- ADRs: zero-padded `NNNN-kebab-title.md`, MADR sections, `Status:` line.
- Flyway: existing `V###__snake_desc.sql`.

## Ownership conventions

- New `.github/CODEOWNERS` maps: `docs/generated/**` → tooling owners (read-only in practice),
  `apps/backend/core-service/**` → core team, `docs/adr/**` → architects, etc.
- Cross-cutting authoritative docs (`docs/db/ownership.md`, `docs/glossary.md`) owned by architects.

## Example directory tree (target, abbreviated)

```
busmate/
├─ apps/backend/
│  ├─ core-service/{src, contracts/openapi.json, .../db/migration/V###__*.sql}
│  ├─ user-service/{src, contracts/openapi.json, contracts/events/asyncapi.yaml}
│  ├─ ticketing-service/{src, contracts/openapi.json}
│  └─ api-gateway/{src/config/routes.config.ts, ...}
├─ libs/api-clients/*           (generated ← committed specs)
├─ docs/
│  ├─ architecture/model/workspace.dsl
│  ├─ workflows/trips.workflow.yaml
│  ├─ adr/, db/, security/, operations/, glossary.md
│  └─ generated/**              (DO NOT EDIT)
├─ tools/{contracts,db,arch,workflows,gen}/
├─ .github/{workflows/*.yml, CODEOWNERS}
└─ AGENTS.md
```

Continue to [05-workflow-and-perspective-model.md](./05-workflow-and-perspective-model.md).
