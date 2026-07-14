# 13 — Acceptance Criteria

> Part of [`system-model-and-documentation-sync`](./README.md). Measurable "done" definition for the *future* implementation (not this planning task).

Each criterion is verifiable by a command or an observable CI behavior. Grouped by concern; the phase that
delivers it is noted.

## Source-of-truth integrity

- **AC1** Every concern in [03-source-of-truth-matrix.md](./03-source-of-truth-matrix.md) has **exactly one**
  authoritative source. *Verify:* `docs/sources.manifest.yaml` has one `authoritative` path per concern; no
  path is authoritative for two concerns. (Phase 0)
- **AC2** No fact is independently maintained in two places. *Verify:* endpoint/role/entity tables in
  `docs/route-network-and-operations/*` are links or generated includes, not re-typed. (Phase 4/10)

## Determinism & generated-file hygiene

- **AC3** Generation is deterministic: running `pnpm nx run-many -t generate` twice yields no git diff.
  *Verify:* `pnpm nx run-many -t generate && git diff --exit-code`.
- **AC4** Every generated file carries a valid `DO NOT EDIT — generated from <source> by <command>` header.
  *Verify:* header-lint gate passes (Phase 9); grep every file under `docs/generated/**`.
- **AC5** All generated outputs live under `docs/generated/**` or `libs/api-clients/*/src/**`. *Verify:* path
  allow-list in `tools/gen` + CODEOWNERS globs. (Phase 0/2)

## APIs & events

- **AC6** Each backend service has a committed `contracts/openapi.json` that matches its code. *Verify:*
  `pnpm nx run <svc>:contract-check` is green. (Phase 2)
- **AC7** Breaking API changes are detected. *Verify:* a PR removing/renaming an endpoint fails
  `contract-diff` (`oasdiff`). (Phase 2/8)
- **AC8** `user-events` has a committed AsyncAPI + JSON Schema, and the publisher payload is validated
  against it. *Verify:* `events-validate` green; a payload change without schema update fails a producer
  test. (Phase 7)
- **AC9** TS API clients regenerate from the **committed** spec (not a live server). *Verify:*
  `api-client-*:generate` reads `contracts/openapi.json`; freshness diff clean. (Phase 2)

## Database

- **AC10** DB schema is reflected by generated ER diagram + data dictionary that match the current schema.
  *Verify:* `<svc>:schema-docs` freshness diff clean. (Phase 3)
- **AC11** Schema changes go through reviewed Flyway migrations; services boot with `ddl-auto: validate`.
  *Verify:* `migrate-check` green; grep `application.yml` shows `validate` on all 3 services. (Phase 5)
- **AC12** Destructive DDL cannot merge without an ADR. *Verify:* a `DROP`-containing migration is blocked by
  the destructive-DDL lint unless a linked ADR exists. (Phase 5/8)

## Workflows & architecture

- **AC13** At least one workflow (Trip) generates ≥6 synchronized perspective diagrams from a single YAML
  source. *Verify:* `docs/generated/workflows/trips/` contains user/system/data/state/failure/security views;
  `docs:workflows` freshness clean. (Phase 4)
- **AC14** Workflow anchors resolve to real code/contracts. *Verify:* renaming a referenced class/endpoint
  fails `docs:workflows-validate`. (Phase 4)
- **AC15** Architecture C4 diagrams are generated from `workspace.dsl` and reflect current services.
  *Verify:* `docs:architecture` freshness clean; container view lists all 4 backend + 5 frontend projects.
  (Phase 6)

## CI & drift

- **AC16** CI detects stale generated documentation. *Verify:* editing a source without regenerating fails
  gate #8. (Phase 2+)
- **AC17** Required (blocking) vs advisory gates are clearly separated and enforced via branch protection.
  *Verify:* branch-protection required-checks list matches [07](./07-ci-cd-and-quality-gates.md). (Phase 8)
- **AC18** CI runs scoped to affected projects. *Verify:* a docs-only PR does not trigger Java service builds.
  (Phase 1)

## AI-agent & human operability

- **AC19** Agents can locate authoritative files without guessing. *Verify:* root `AGENTS.md` §2 + the
  manifest name every authoritative path; a fresh agent edits the controller (not `openapi.json`) when asked
  to change an endpoint. (Phase 0/9)
- **AC20** Reverse (doc→code) changes require validation + human review. *Verify:* a doc-implied code change
  produces `docs/proposals/<id>.md` and never a direct `apps/**` edit. (Phase 9)
- **AC21** The whole system is operable without AI. *Verify:* every generation/validation step in
  [09](./09-developer-experience.md) is a documented `pnpm nx` command; a developer reproduces all CI gates
  locally.
- **AC22** Generated docs and diagrams are viewable in VS Code. *Verify:* Mermaid renders in Markdown preview
  (`bierner.markdown-mermaid`); OpenAPI opens in `42crunch.vscode-openapi`; both are recommend-only in
  [.vscode/extensions.json](../../.vscode/extensions.json).

## Ownership & knowledge

- **AC23** Every top-level source/docs area has an owner. *Verify:* `.github/CODEOWNERS` covers `docs/adr`,
  `docs/architecture`, `apps/backend/*`, `docs/generated` (tooling), with no uncovered top-level path.
  (Phase 0/8)
- **AC24** ADRs exist for the load-bearing decisions (contract freeze, Flyway adoption, reverse-proposal
  model). *Verify:* `docs/adr/` contains them with `Status:` and supersession links. (Phase 5/9)

## Global "definition of done"

The implementation is complete when **AC1–AC24 hold simultaneously on `main`**, all blocking CI gates are
green, and a developer with only VS Code + pnpm + Docker (no AI) can: author a source, regenerate, validate,
and view every derived diagram — while an AI agent performing the same task follows `AGENTS.md`, edits only
sources, regenerates outputs, and reports impact.

Back to [00-executive-summary.md](./00-executive-summary.md).
