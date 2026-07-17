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
| `api-core` | `apps/backend/api-core` | Spring Boot (Java 17) | Route & schedule microservice |

## Getting Started

### Prerequisites
- Node.js >= 20
- Java 17 + Maven (for backend services)

### Install root dependencies (Nx)
```bash
npm install --no-workspaces
```

### Install app dependencies
```bash
# Frontend apps
cd apps/frontend/new-react-portal && npm install
cd apps/frontend/passenger-web && npm install  # or bun install
```

## Nx Commands

### Run targets on a single project
```bash
npx nx <target> <project>

# Examples
npx nx dev new-react-portal
npx nx dev passenger-web
npx nx build new-react-portal
npx nx build passenger-web
npx nx serve api-core          # Spring Boot default profile
npx nx serve:local api-core    # Spring Boot with local DB
npx nx test api-core
```

### Run targets across all projects
```bash
npx nx run-many -t build           # Build all projects
npx nx run-many -t lint            # Lint all projects
npx nx run-many -t test            # Test all projects
```

### Run only affected projects (CI-friendly)
```bash
npx nx affected -t build           # Build only changed projects
npx nx affected -t test            # Test only changed projects
npx nx affected -t lint            # Lint only changed projects
```

### View the project graph
```bash
npx nx graph
```

### API client generation
```bash
# new-react-portal
npx nx generate:api-route:local new-react-portal
npx nx generate:api-ticketing:local new-react-portal

# passenger-web
npx nx generate:api-route:local passenger-web
npx nx generate:api-user:local passenger-web

# api-core backend targets
npx nx build api-core              # mvnw compile
npx nx package api-core            # mvnw package (creates JAR)
npx nx docker:build api-core       # docker build
```

## Nx Tags

Projects are tagged for fine-grained control:

| Tag | Projects |
|---|---|
| `scope:frontend` | `new-react-portal`, `passenger-web` |
| `scope:backend` | `api-core` |
| `framework:vite` | `new-react-portal`, `passenger-web` |
| `framework:spring-boot` | `api-core` |

Run only frontend apps:
```bash
npx nx run-many -t build --projects=tag:scope:frontend
```

## Caching

Nx caches the results of `build`, `test`, and `lint` targets automatically. Cached outputs are stored in `.nx/cache`. To skip cache:
```bash
npx nx build new-react-portal --skip-nx-cache
```

## Local Dev Tooling

| Tool | Path | Purpose |
|---|---|---|
| Observability stack (Grafana/Loki/Prometheus/Tempo) | `config/observability/README.md` | Logs, metrics, traces, alerting |
| DbGate | `tools/dbgate/README.md` | GUI for the local dev Postgres (`pnpm db:dev:gui`) |
