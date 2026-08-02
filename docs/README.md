# docs/

**Reference material: how to run, seed and operate the platform.** Everything here answers *how do I
do X* or *what did we build and why*. Nothing here governs how work is done.

## What goes where

| If it is… | It belongs in… |
|---|---|
| Why we are building this, what is in scope, a decision and its alternatives | [`intent/`](../intent/) |
| A goal with acceptance criteria for a piece of work | [`intent/increments/`](../intent/increments/) |
| Risk classes, autonomy, how AI agents work here | [`CLAUDE.md`](../CLAUDE.md) and [`intent/policy.yaml`](../intent/policy.yaml) |
| Commands, Nx usage, cross-platform notes | the root [`README.md`](../README.md) |
| How to run, seed, build or operate something | **here** |
| What changed, who approved it, whether tests passed | git, CI and the PR — **never a file** |

The methodology itself is [`haco-methodology.md`](../haco-methodology.md), summarised for daily use in
[`CLAUDE.md`](../CLAUDE.md). **Do not add a process, playbook, or agent-operating document to this
directory.** Five competing ones accumulated here before and none were ever adopted; INC-001 removed
them.

## Running and seeding

| Doc | Use it for |
|---|---|
| [local-dev-quickstart.md](local-dev-quickstart.md) | **Start here.** Every service, gateway and frontend running locally against a seeded database, with test scenarios |
| [busmate-platform-run-guide.md](busmate-platform-run-guide.md) | Running the platform |
| [dev-full-platform-with-iot-guide.md](dev-full-platform-with-iot-guide.md) | The full platform including the IoT/telemetry layer |
| [database-management-guide.md](database-management-guide.md) | Working with the databases |
| [database-reset-and-seed-guide.md](database-reset-and-seed-guide.md) | Resetting and reseeding |

> These four run/start guides overlap substantially and are queued for consolidation — see
> "Documentation" in [`intent/backlog.md`](../intent/backlog.md).

## Contracts and credentials

| Doc | Use it for |
|---|---|
| [dev-seed-contract.md](dev-seed-contract.md) | **The fixed-UUID registry** for demo entities that cross service boundaries. Classified R3 — inventing a UUID here silently breaks other services' seeds |
| [dev-seed-credentials.md](dev-seed-credentials.md) | Seeded demo logins |
| [operator-conductor-seed-credentials.md](operator-conductor-seed-credentials.md) | Operator and conductor demo logins |
| [dev-iot-device-credentials.md](dev-iot-device-credentials.md) | Seeded device tokens for the simulator |

Several of these are referenced by name from seed SQL, `config/mqtt/emqx.conf` and
`scripts/*.sh`. **Their paths are load-bearing — do not move or rename them** without updating every
reference, and note that comments inside already-applied Flyway migrations cannot be edited at all.

## Operations and build

| Doc | Use it for |
|---|---|
| [iot-pilot-runbook.md](iot-pilot-runbook.md) | Running an IoT hardware pilot |
| [mobile-apk-build-guide.md](mobile-apk-build-guide.md) | Building the Expo apps |
| [vscode-monorepo-performance-optimization.md](vscode-monorepo-performance-optimization.md) | Making VS Code usable in this monorepo |
| [ui/10-scalable-ui-development-approach.md](ui/10-scalable-ui-development-approach.md) | The `libs/ui` resource-layer design, referenced from `libs/ui/src/resource/index.ts` |

`libs/ui` **naming conventions** are authoritative in
[`.github/instructions/ui-library-naming-conventions.instructions.md`](../.github/instructions/ui-library-naming-conventions.instructions.md),
which auto-applies to `libs/ui/**`.

## [plans/](plans/) — historical design records

**Completed work, kept for the reasoning.** These are not active plans and should not be treated as a
roadmap; unfinished items from them now live in [`intent/backlog.md`](../intent/backlog.md).

They are retained because **51 references across 45 files point at them** — `application.yml`
comments, Java test base classes, `libs/iot-schemas/schemas/envelope.v1.json`, and applied Flyway
migration and seed SQL. Migration comments are immutable in practice: editing an applied `V*` file
changes its checksum and fails the `flyway validate` gate in CI.

| Plan | State |
|---|---|
| [Database-Migrations-and-Seed-Data-Plan.md](plans/Database-Migrations-and-Seed-Data-Plan.md) | Phases 0–5 complete. The deferred follow-ups are in the backlog |
| [Logging-and-Monitoring-Implementation-Plan.md](plans/Logging-and-Monitoring-Implementation-Plan.md) | All 6 phases complete |
| [Self-Hosted-Auth-Migration-Plan.md](plans/Self-Hosted-Auth-Migration-Plan.md) | Phases 1–5 complete; 6–7 outstanding |
| [IoT-Platform-Layer-Plan.md](plans/IoT-Platform-Layer-Plan.md) | Through Phase 4 |

New work does not get a plan document. It gets an increment file in
[`intent/increments/`](../intent/increments/).
