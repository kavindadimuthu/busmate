# BusMate Monorepo

A monorepo managed with [Nx](https://nx.dev) containing the BusMate platform applications.

## Applications

| Project | Path | Stack | Description |
|---|---|---|---|
| `management-portal` | `apps/frontend/management-portal` | Next.js | Operations & fleet management dashboard |
| `passenger-web` | `apps/frontend/passenger-web` | Vite + React | Passenger-facing web app |
| `api-core` | `apps/backend/api-core` | Spring Boot (Java 21) | Route & schedule microservice |

## Getting Started

### Prerequisites
- Node.js >= 20
- Java 21 + Maven (for `api-core`)

### Install root dependencies (Nx)
```bash
npm install --no-workspaces
```

### Install app dependencies
```bash
# Frontend apps
cd apps/frontend/management-portal && npm install
cd apps/frontend/passenger-web && npm install  # or bun install
```

## Nx Commands

### Run targets on a single project
```bash
npx nx <target> <project>

# Examples
npx nx dev management-portal
npx nx dev passenger-web
npx nx build management-portal
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
# management-portal
npx nx generate:api-route:local management-portal
npx nx generate:api-ticketing:local management-portal

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
| `scope:frontend` | `management-portal`, `passenger-web` |
| `scope:backend` | `api-core` |
| `framework:next` | `management-portal` |
| `framework:vite` | `passenger-web` |
| `framework:spring-boot` | `api-core` |

Run only frontend apps:
```bash
npx nx run-many -t build --projects=tag:scope:frontend
```

## Caching

Nx caches the results of `build`, `test`, and `lint` targets automatically. Cached outputs are stored in `.nx/cache`. To skip cache:
```bash
npx nx build management-portal --skip-nx-cache
```
