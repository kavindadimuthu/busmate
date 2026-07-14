# 09 — Developer Experience

> Part of [`system-model-and-documentation-sync`](./README.md). The system must be fully operable by a human in VS Code, with no AI.

## Principle

Every CI gate ([07](./07-ci-cd-and-quality-gates.md)) has a one-line local equivalent. Every generated
artifact ([06](./06-generation-and-synchronization-plan.md)) is produced by a plain `pnpm nx` command.
Nothing depends on an AI agent.

## Local generation commands (recap)

```bash
pnpm nx run <svc>:contract            # freeze OpenAPI spec from code
pnpm nx run api-client-<x>:generate   # regenerate a TS client from committed spec
pnpm nx run-many -t generate          # regenerate ALL derived docs/diagrams
pnpm nx run docs:workflows            # workflow YAML -> perspective Mermaid
pnpm nx run docs:architecture         # workspace.dsl -> C4 diagrams
pnpm nx run <svc>:schema-docs         # DB -> ER + data dictionary
```

## Local validation commands

```bash
pnpm nx affected -t build,test,lint            # existing affected:* scripts
pnpm nx run <svc>:contract-check               # spec freshness
pnpm nx run <svc>:contract-diff                # oasdiff vs main
git diff --exit-code docs/generated            # generated-doc freshness
pnpm nx run docs:workflows-validate            # anchors resolve
```

## VS Code visualization (uses already-recommended extensions)

The repo already curates [.vscode/extensions.json](../../.vscode/extensions.json). Most needs are
covered; only a couple of *doc* extensions would be added (recommend-only, never auto-install):

| Need | How, in VS Code | Extension |
|---|---|---|
| Markdown preview | built-in | — |
| **Mermaid preview** (workflows, C4, ER) | built-in Markdown preview renders Mermaid in recent VS Code; else a Mermaid preview ext | `bierner.markdown-mermaid` (recommend) |
| **OpenAPI preview** | Swagger UI is already served by springdoc at `/swagger-ui`; for the committed spec use an OpenAPI ext | `42crunch.vscode-openapi` (recommend) |
| **Database diagram** | open generated `docs/generated/db/<svc>/er.mmd` in Mermaid preview | (Mermaid ext above) |
| **Architecture preview** | render `workspace.dsl` via Structurizr Lite (local Docker) or view generated Mermaid | Structurizr Lite (optional, Docker) |
| Java/Spring | already recommended | `vscjava.vscode-java-pack`, `vmware.vscode-spring-boot` |
| Nx graph | `pnpm graph` opens interactive project graph | `nrwl.angular-console` (already recommended) |

**Only 2 new recommendations** (`bierner.markdown-mermaid`, `42crunch.vscode-openapi`), consistent with
the repo's deliberate minimal-extension policy documented in
[docs/vscode-monorepo-performance-optimization.md](../../docs/vscode-monorepo-performance-optimization.md).

## Watch mode (where it helps)

- Workflows/architecture/DB docs: an optional `pnpm nx run docs:workflows --watch` (chokidar on the
  source globs) regenerates on save so the Mermaid preview live-updates. Keep it **opt-in** — the repo's
  VS Code settings deliberately limit background watchers ([.vscode/settings.json](../../.vscode/settings.json)
  `files.watcherExclude`), so watch mode is a foreground dev command, not an always-on service.
- API clients: not worth watch mode (needs a running/rebuilt service); run `:contract` on demand.

## Pre-commit checks

The repo currently has **no git hooks** and **no husky**. Proposed **light** hook (optional, Phase 8):
- Fast local checks only: `contract-check` and `docs/generated` freshness for *affected* projects.
- Must be bypassable (`--no-verify`) and fast (<10s) or developers will disable it. Heavy checks stay in CI.
- Reuse the pattern that CI runs the same scripts, so the hook is just an early mirror.

## Troubleshooting quick reference

| Symptom | Cause | Fix |
|---|---|---|
| CI "spec not fresh" | edited controller, didn't refreeze | `pnpm nx run <svc>:contract` and commit |
| CI "generated docs stale" | edited a model source | `pnpm nx run-many -t generate` and commit |
| CI "breaking API change" | removed/renamed endpoint | intended? add `BREAKING CHANGE:` commit + version bump; else fix |
| CI "workflow anchor unresolved" | renamed a class/endpoint referenced by a workflow | update the `anchors:` in the `.workflow.yaml` |
| Merge conflict in generated file | two branches regenerated | discard both, regenerate from merged source |
| Mermaid not rendering | preview ext missing | install `bierner.markdown-mermaid` |

## Operating without AI

Every step above is a documented shell command. The generators are deterministic scripts under
[tools/](../../tools); the sources are human-readable (OpenAPI JSON, YAML, DSL, SQL, Markdown). A
developer with only VS Code + pnpm + Docker can author sources, regenerate, validate, and read every
diagram. AI agents are an *accelerator*, never a dependency — which is exactly why the authoritative
sources are all plain text and the rules live in `AGENTS.md` + headers rather than in a model's head.

Continue to [10-implementation-roadmap.md](./10-implementation-roadmap.md).
