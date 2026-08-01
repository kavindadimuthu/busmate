# BusMate Monorepo

A monorepo managed with [Nx](https://nx.dev) containing the BusMate platform applications.

> **New to the project?** [`docs/local-dev-quickstart.md`](docs/local-dev-quickstart.md) walks
> through running every backend service, the gateway, and the frontend apps locally against a
> seeded database, plus a set of test scenarios covering the platform's major functionality.

## Applications

| Project | Path | Stack | Description |
|---|---|---|---|
| `new-react-portal` | `apps/frontend/new-react-portal` | Vite + React | Operations & fleet management dashboard (MOT / operator / admin / timekeeper) |
| `passenger-web` | `apps/frontend/passenger-web` | Vite + React | Passenger-facing web app |
| `passenger-mobile` | `apps/frontend/passenger-mobile` | Expo / React Native | Passenger mobile app |
| `conductor-mobile` | `apps/frontend/conductor-mobile` | Expo / React Native | Conductor mobile app |
| `api-gateway` | `apps/backend/api-gateway` | Node + TypeScript | Single entry point (`:8080`) every frontend calls |
| `user-service` | `apps/backend/user-service` | Spring Boot (Java 17) | Auth, users, RBAC, profiles (`:9020`) |
| `core-service` | `apps/backend/core-service` | Spring Boot (Java 17) | Routes, schedules, stops, fleet, permits (`:9010`) |
| `ticketing-service` | `apps/backend/ticketing-service` | Spring Boot (Java 17) | Tickets, fares, trip summaries (`:9030`) |
| `telemetry-service` | `apps/backend/telemetry-service` | Spring Boot (Java 17) | IoT / vehicle telemetry ingestion |

## Getting Started

Works the same on Windows and Linux — see [Cross-platform notes](#cross-platform-notes) below.

### Prerequisites
- **Node.js >= 20**
- **pnpm >= 10** — the workspace pins `pnpm@10.26.1`; run `corepack enable` to pick it up
- **Java 17** (the Maven Wrapper in each service downloads Maven itself — no separate install)
- **Docker** and **Docker Compose**
- **Windows only:** Git for Windows, with `C:\Program Files\Git\bin` on `PATH` — the seeding and
  e2e helper scripts are invoked as `bash <script>`

### Install

```bash
corepack enable      # pins pnpm 10.26.1 from package.json
pnpm install         # installs every workspace package (see pnpm-workspace.yaml)
pnpm run setup       # creates config/secrets/.env and checks your toolchain
```

`pnpm install` covers the whole workspace — there is no per-app install step. The Spring Boot
services are Maven-managed and sit outside the pnpm workspace; their dependencies resolve on first
build via the Maven Wrapper.

Then follow [`docs/local-dev-quickstart.md`](docs/local-dev-quickstart.md) to start the database,
backend and frontends.

## Nx Commands

Always go through `pnpm run nx` rather than `npx nx`. The workspace runs Nx with the daemon and
plugin isolation disabled (they are unstable against this repo's mix of Vite, Expo and Maven
projects); `pnpm run nx` applies those settings via [`scripts/nx.mjs`](scripts/nx.mjs), and `npx nx`
silently does not.

### Run targets on a single project
```bash
pnpm run nx <target> <project>

# Examples
pnpm run nx dev new-react-portal
pnpm run nx dev api-gateway
pnpm run nx dev user-service        # Spring Boot, via the Maven Wrapper
pnpm run nx build passenger-web
pnpm run nx package core-service    # builds the JAR
pnpm run nx test core-service
pnpm run nx docker:build core-service
```

**`dev` is the run verb for every app**, backend and frontend alike. The Spring services also accept
`serve` as an alias, but nothing else does — Nx infers the Node projects' targets from their
`package.json` script names, and none of them define a `serve` script.

### Run targets across all projects
```bash
pnpm run nx run-many -t build      # or: pnpm run build
pnpm run nx run-many -t lint       # or: pnpm run lint
pnpm run nx run-many -t test       # or: pnpm run test
```

### Run only affected projects (CI-friendly)
```bash
pnpm run affected:build            # Build only changed projects
pnpm run affected:test
pnpm run affected:lint
```

### View the project graph
```bash
pnpm run graph
```

## Nx Tags

Projects are tagged for fine-grained control:

| Tag | Projects |
|---|---|
| `scope:frontend` | `new-react-portal`, `passenger-web`, `passenger-mobile`, `conductor-mobile` |
| `scope:backend` | `user-service`, `core-service`, `ticketing-service`, `telemetry-service`, `api-gateway` |
| `framework:vite` | `new-react-portal`, `passenger-web` |
| `framework:spring-boot` | `user-service`, `core-service`, `ticketing-service`, `telemetry-service` |

Run only frontend apps:
```bash
pnpm run nx run-many -t build --projects=tag:scope:frontend
```

## Caching

Nx caches the results of `build`, `test`, and `lint` targets automatically. Cached outputs are stored in `.nx/cache`. To skip cache:
```bash
pnpm run nx build new-react-portal --skip-nx-cache
```

## Cross-platform notes

Every `pnpm run` script works identically on Windows and Linux. pnpm executes scripts through
`cmd.exe` on Windows, which does not understand POSIX shell syntax, so three thin Node wrappers
stand in for it:

| Wrapper | Replaces | Why |
|---|---|---|
| [`scripts/mvnw.mjs`](scripts/mvnw.mjs) | `./mvnw` | `cmd.exe` reads the `/` in `./mvnw` as a switch delimiter and fails with `'.' is not recognized`. The wrapper picks `mvnw.cmd` on Windows and `mvnw` elsewhere. |
| [`scripts/nx.mjs`](scripts/nx.mjs) | `NX_DAEMON=false … nx` | Inline `VAR=value cmd` prefixes are POSIX-only; `cmd.exe` tries to run a program literally named `NX_DAEMON=false`. |
| [`scripts/with-env.mjs`](scripts/with-env.mjs) | any other `VAR=value cmd` | Same reason; a local stand-in for `cross-env`, so no extra dependency. |

Two things still need a POSIX shell, and on Windows are covered by Git Bash being on `PATH`:
the seed scripts (`scripts/*.sh`) and the e2e environment helpers (`tests/e2e/scripts/*.sh`).
They are invoked explicitly as `bash <script>`, so no shell rewriting is involved.

[`.gitattributes`](.gitattributes) forces LF for `mvnw` and `*.sh`. Without it, a Windows clone with
`core.autocrlf=true` rewrites them to CRLF and they fail under `sh` with `bad interpreter: /bin/sh^M`
— including inside the Linux containers built from this repo.

The root [`Makefile`](Makefile) is an optional convenience for Linux/macOS only; it just wraps the
`pnpm run` scripts, which are the canonical interface on every platform.

## Local Dev Tooling

| Tool | Path | Purpose |
|---|---|---|
| Observability stack (Grafana/Loki/Prometheus/Tempo) | `config/observability/README.md` | Logs, metrics, traces, alerting |
| DbGate | `tools/dbgate/README.md` | GUI for the local dev Postgres (`pnpm db:dev:gui`) |
