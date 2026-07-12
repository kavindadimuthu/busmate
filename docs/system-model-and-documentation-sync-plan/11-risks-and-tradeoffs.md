# 11 — Risks & Tradeoffs

> Part of [`system-model-and-documentation-sync`](./README.md). Each risk has mitigation + warning signs.

| # | Risk | Why it applies here | Mitigation | Warning signs |
|---|---|---|---|---|
| R1 | **Excessive tooling** | Temptation to add PlantUML, Protobuf, BPMN, Terraform, k8s all at once | Smallest coherent toolset only: OpenAPI, AsyncAPI+JSON Schema, Flyway, Structurizr, Mermaid, Markdown. Everything else = *Not recommended* ([12](./12-open-questions-and-decisions.md)) | New tool proposed without retiring another; CI job count creeping |
| R2 | **Duplicate sources of truth** | Already present: prose restates endpoint/role/entity facts; clients duplicated in mobile apps | [03-source-of-truth-matrix.md](./03-source-of-truth-matrix.md) enforces one source; Phase 4/10 convert prose tables to links; Phase 10 consolidates clients | Same fact edited in two files in one PR; reviewers copy-pasting |
| R3 | **Generated-code noise in diffs** | Committing `openapi.json` + clients + diagrams enlarges diffs | Determinism (sorted, no timestamps); CODEOWNERS marks generated globs; reviewers focus on the *source* diff; collapse generated paths in review | Huge no-signal diffs; reviewers rubber-stamping |
| R4 | **Slow CI** | Java builds + generation on every PR | Nx `affected` scoping (already configured); cache pnpm+Nx+Maven; advisory lane runs async | PR feedback > ~10 min; devs skipping local checks |
| R5 | **Unreadable models** | Over-abstract workflow YAML nobody edits | Keep schema small ([05](./05-workflow-and-perspective-model.md)); pilot on real Trip flow; narrative stays prose | People bypass the model and hand-write diagrams again |
| R6 | **Overly generic schemas** | A one-size workflow schema that fits nothing well | Start with Trip's real needs; extend only when a 2nd workflow demands it | Fields added "for completeness" that no workflow uses |
| R7 | **Unsafe reverse generation** | Auto doc→code could corrupt services | Reverse is proposal-only + human-gated ([06](./06-generation-and-synchronization-plan.md)); path allow-list forbids writing to sources | Any tool that edits `apps/**` from a doc change |
| R8 | **Destructive database changes** | `ddl-auto: update` + live Supabase DBs + moving to Flyway | Phase 5 goes one service per PR, backup first, `validate` not `update`, baseline-on-migrate, destructive-DDL lint blocks drops without ADR | Boot fails on `validate`; unexpected `DROP` in a migration diff |
| R9 | **`ddl-auto` ↔ Flyway conflict** | If both manage schema simultaneously | Flip `ddl-auto`→`validate` *in the same PR* that introduces Flyway per service; never run both as authorities | Schema changes appearing without a migration |
| R10 | **Agent-created inconsistencies** | Agents editing generated files or the wrong source | Generated-file headers + `AGENTS.md` §3 + CI freshness gate #8 + header-lint (Phase 9) | Generated file edited by hand in a PR; freshness gate failing repeatedly |
| R11 | **Tool lock-in** | Structurizr DSL / vendor formats | All formats are OSS + plain text + exportable (DSL→Mermaid, OpenAPI is portable); no proprietary store | Only one vendor tool can read a source |
| R12 | **Stale diagrams** | The problem we're solving could recur if diagrams aren't gated | Diagrams are generated + freshness-gated (#8); ban hand-drawn architecture Mermaid in prose | A `.mmd`/diagram edited directly; prose diagram reappears |
| R13 | **Documentation nobody uses** | Rich docs already exist; more could rot | Generate from truth so docs can't rot silently; keep `docs/generated/INDEX.md` as the entry point; tie docs to CI so they must stay fresh | Docs not opened in reviews; INDEX links rotting |
| R14 | **High migration cost** | 3 Java services + 5 frontends | Phased, each phase 1–3 PRs, reversible; reuse existing codegen/Nx | A phase ballooning beyond ~3 PRs |
| R15 | **Team adoption** | New commands + gates on a repo with no prior CI | Advisory-before-blocking; every gate hand-runnable; document in `AGENTS.md` + [09](./09-developer-experience.md); train on the Trip pilot | `--no-verify` everywhere; gates disabled |
| R16 | **Springdoc build-time spec accuracy** | Build-time spec may differ from runtime (profiles/conditional beans) | Validate the frozen spec against a running instance in E2E occasionally; pin springdoc config | Client works against spec but fails against live server |
| R17 | **Supabase multi-project reality** | core-service & user-service point at *different* Supabase projects (per memory) | Treat each service's DB independently in Phase 3/5; ownership doc records which project owns what | A migration run against the wrong project |

## Key tradeoffs (explicit)

- **Commit generated files vs generate-in-CI.** We commit them → bigger diffs (R3) but reviewable drift
  and offline reproducibility. Chosen because hiding generated output defeats the drift-detection goal.
- **Code-first API vs spec-first API.** We keep code-first (springdoc already exists) → less upfront
  rewrite, but the spec is a *derived-then-frozen* artifact requiring a freshness gate. Spec-first was
  rejected as too disruptive to 3 working services.
- **Flyway now vs later.** Deferred to Phase 5 behind the safety net → slower DB benefit, but avoids a
  destructive change before contracts + CI exist.
- **One workflow schema vs per-domain schemas.** One shared schema → some genericity risk (R6),
  mitigated by piloting on a real workflow before generalizing.

Continue to [12-open-questions-and-decisions.md](./12-open-questions-and-decisions.md).
