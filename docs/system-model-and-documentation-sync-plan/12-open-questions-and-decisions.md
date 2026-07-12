# 12 — Open Questions & Decisions

> Part of [`system-model-and-documentation-sync`](./README.md). Things the repository cannot answer — with a recommended default for each.

## A. Decisions requiring project-owner input (block later phases)

| ID | Question | Options | Recommended default | Consequence / blocks |
|----|----------|---------|---------------------|-----------------------|
| Q1 | **Is `ddl-auto: update` on live Supabase acceptable to change?** | (a) adopt Flyway + `validate` (b) keep `ddl-auto` | **(a)** — but only in Phase 5 with backups | Blocks Phase 5. Highest-risk decision. Needs a maintenance window + confirmation of who owns each Supabase project. |
| Q2 | **How is the OpenAPI spec produced in CI — build-time plugin or boot+curl?** | (a) springdoc-maven-plugin at build (b) boot service + curl `/v3/api-docs` | **(a)** build-time — works in CI without a DB | Blocks Phase 2. (b) needs a test DB in CI. |
| Q3 | **Commit generated files, or gitignore + generate-in-CI?** | (a) commit (b) ignore | **(a)** commit — enables review + drift diff | Shapes Phases 2–8. |
| Q4 | **Which service leads the Flyway rollout?** | ticketing (3 controllers, smallest) / user / core | **ticketing-service first** (smallest surface) | Sequencing of Phase 5. Needs confirmation ticketing's DB is safe to pilot on. |
| Q5 | **Enforcement timeline** — how long advisory before blocking? | 1 wk / 2 wk / manual | **2 weeks green soak** | Phase 8 timing. |
| Q6 | **Owner assignments for CODEOWNERS** | — | Fill from git history; architects own `docs/adr`, `docs/glossary`, `docs/architecture` | Blocks Phase 0 completion. Repo can't infer real team boundaries. |

## B. Tooling alternatives (recommendation given, owner may override)

| ID | Choice | Recommended | Alternatives considered | Why |
|----|--------|-------------|-------------------------|-----|
| Q7 | Architecture model | **Structurizr DSL** | PlantUML C4, Mermaid-only, diagrams-as-code (Python) | Single model → multiple C4 views; plain text; OSS; exports to Mermaid. Mermaid-only rejected (no single model → drift). |
| Q8 | ER/data-dictionary generator | **SchemaCrawler** (or `pg_dump`→parser) | Liquibase diff, tbls, prisma introspection | Java-friendly, offline, Mermaid ER output. `tbls` is a strong alt (nicer Markdown) — acceptable substitute. |
| Q9 | DB migrations | **Flyway** | Liquibase | Simpler SQL-first model matching the existing `V###__*.sql` files already in core-service. |
| Q10 | Breaking API diff | **oasdiff** | openapi-diff (OpenAPITools) | Actively maintained, good breaking-change classification, CI-friendly. |
| Q11 | Event contracts | **AsyncAPI + JSON Schema** | Avro, Protobuf schema registry | JSON payloads + single topic don't justify a registry; AsyncAPI is text + AI-readable. Revisit if topics multiply. |
| Q12 | Workflow schema | **Custom YAML + JSON Schema** | BPMN, Senna/Serverless Workflow | BPMN is heavy/visual-tool-centric and poor in git diffs; a small YAML fits AI + humans + Mermaid generation. |
| Q13 | Link/diagram CI | **lychee / markdown-link-check + mermaid-cli** | — | Standard, fast, OSS. |

## C. Information unavailable from the repository (record, don't invent)

- **U1** Real team/ownership boundaries — no `CODEOWNERS` exists; git shows a single author. Needs human input (Q6).
- **U2** SLOs, alerting, monitoring, backup/DR procedures — essentially absent in the repo; must be authored, not derived.
- **U3** Which Supabase project each service *actually* targets in each environment — memory hints they differ; must be confirmed before Phase 5 (Q1/Q4).
- **U4** Whether any external consumer (mobile app in production) depends on the *current* live spec shape — affects how aggressive the breaking-change gate should be initially.
- **U5** The full inbound contract of the mobile-app→ticketing-service direct-IP path (memory notes plain-text parsing) — undocumented; capture in Phase 10.
- **U6** Retention/deletion and PII classification of columns — not in schema; requires data-owner input.
- **U7** Whether pre-existing tests are green — Phase 1 will reveal; may gate how quickly CI becomes blocking.

## D. Decisions that can be safely deferred

- Test generation from workflows (defer past Phase 10 pilot).
- Consolidating duplicated mobile API clients (Phase 10).
- k8s/Terraform infra-as-code modeling — **not recommended now** (deployment is docker-compose; no k8s in repo).
- Multi-topic event registry — defer until events grow beyond `user-events`.
- Storybook/UI-component contract modeling — out of scope for this system.

## E. Explicitly *Not recommended* (to prevent scope creep)

- Protobuf/Avro + schema registry (Q11) — unjustified for one JSON topic.
- BPMN for workflows (Q12) — poor git/AI ergonomics.
- Terraform/Kubernetes manifests — no such infra exists; would be modeling a non-existent target.
- Bidirectional auto-sync of any kind — replaced by the reviewed-proposal model ([06](./06-generation-and-synchronization-plan.md)).

Continue to [13-acceptance-criteria.md](./13-acceptance-criteria.md).
