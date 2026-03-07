# BusMate — End-to-End Tests

Playwright-based e2e test suite for the **Management Portal** (Next.js).
Tests are written in TypeScript and follow the Page Object Model pattern.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick start — Docker environment (recommended)](#quick-start--docker-environment-recommended)
4. [Running tests](#running-tests)
5. [Environment configuration](#environment-configuration)
6. [How the Docker environment works](#how-the-docker-environment-works)
7. [Test structure](#test-structure)
8. [Writing new tests](#writing-new-tests)
9. [CI / CD](#ci--cd)
10. [Troubleshooting](#troubleshooting)

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  Host machine                                               │
│                                                             │
│  Playwright test runner                                     │
│       │                                                     │
│       │  Chromium browser (headless)                        │
│       │       │                                             │
│       │       │  HTTP  http://localhost:3000                │
│       │       ▼                                             │
│  ┌────────────────────┐                                     │
│  │  Next.js dev server│  ← started by Playwright webServer  │
│  │  (management portal│    with NEXT_PUBLIC_ROUTE_          │
│  │   port 3000)       │    MANAGEMENT_API_URL set to        │
│  └────────┬───────────┘    the test backend                 │
│           │                                                 │
│           │  HTTP  http://localhost:8081                    │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │  Docker: busmate-e2e-backend            │               │
│  │  Spring Boot  (port 8081 → 8080)        │               │
│  │  Profile: e2e  |  ddl-auto: create-drop │               │
│  └──────────────────┬──────────────────────┘               │
│                     │  jdbc:postgresql://postgres:5432      │
│                     ▼                                       │
│  ┌─────────────────────────────────────────┐               │
│  │  Docker: busmate-e2e-postgres           │               │
│  │  PostgreSQL 16  (port 5433 → 5432)      │               │
│  │  Fresh, ephemeral — wiped on stop       │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

**Key isolation properties:**

| Resource | Dev environment | E2E test environment |
|----------|----------------|----------------------|
| PostgreSQL port | 5432 | **5433** |
| Backend port | 8080 | **8081** |
| Database | `sample` (shared) | `busmate_e2e` (ephemeral) |
| Schema lifecycle | persistent | created on start, dropped on stop |
| Data after run | persists | **zero** — volumes deleted on `env:stop` |

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 20 | Required by all frontend tooling |
| pnpm | 10 | Workspace package manager |
| Docker Desktop (or Engine) | 24 | Required for the isolated environment |
| Docker Compose v2 | 2.20 | Bundled with Docker Desktop |

> **Asgardeo test account**
> Tests authenticate via the real Asgardeo identity provider. You need an
> Asgardeo test user with the **MOT** role assigned. Add those credentials to
> your `.env` file (see [Environment configuration](#environment-configuration)).

---

## Quick start — Docker environment (recommended)

```bash
# 1. Install Node.js dependencies (first time only)
pnpm install

# 2. Install Playwright browsers (first time only)
pnpm exec playwright install --with-deps chromium

# 3. Create your local environment file
cp tests/e2e/.env.example tests/e2e/.env
#    → Edit tests/e2e/.env and fill in ASGARDEO_TEST_USERNAME / PASSWORD

# 4. Start the isolated test environment (builds Docker images on first run)
pnpm run e2e:env:start

# 5. Run the full test suite
pnpm run e2e:docker

# 6. Stop the environment and wipe all test data
pnpm run e2e:env:stop
```

The first `e2e:env:start` call builds the Spring Boot Docker image from source
(Maven download + compile). Subsequent starts reuse the cached layer unless
`pom.xml` or source files change.

---

## Running tests

All scripts can be run from the monorepo root or from `tests/e2e/`.

### Test execution modes

The test suite supports multiple execution modes for different purposes:

#### 🚀 **Headless mode** (default, CI-friendly)
Fast, no UI, runs in the background. Best for CI/CD and quick feedback.

```bash
pnpm run e2e:docker               # Docker environment, headless
pnpm run e2e                      # Local dev environment, headless
```

#### 👁️ **Headed mode** (visible browser)
Shows browser window during test execution. Great for watching tests run and debugging.

```bash
pnpm run e2e:docker:headed        # Docker environment, show browser
pnpm run e2e:headed               # Local dev environment, show browser
```

#### 🐢 **Slow mode** (headed + slowed down)
Runs tests with visible browser **and** adds 500ms delay between operations.
Perfect for clearly seeing each action without the test running too fast.

```bash
pnpm run e2e:docker:slow          # Headed + 500ms slowdown
```

To customize the slowdown amount, use the `SLOW_MO` environment variable:

```bash
SLOW_MO=800 pnpm run e2e:docker:headed    # 800ms delay per operation
SLOW_MO=300 pnpm run e2e:docker:headed    # 300ms delay (subtle slowdown)
SLOW_MO=1500 pnpm run e2e:docker:headed   # 1.5s delay (very slow, detailed debugging)
```

**Recommended SLOW_MO values:**
- `0` (default): Full speed, no delay
- `300-500`: Comfortable viewing speed without being too slow
- `800-1000`: Easier to follow each step visually
- `1500+`: Very slow, use only for detailed step-by-step debugging

#### 🔍 **Debug mode** (Playwright Inspector)
Opens Playwright Inspector for step-by-step debugging with breakpoints.

```bash
pnpm run e2e:docker:debug         # Docker environment with Inspector
pnpm run e2e:debug                # Local dev environment with Inspector
```

#### 🎛️ **UI mode** (interactive test runner)
Opens Playwright's interactive UI for running, debugging, and exploring tests.
Provides a visual test explorer with time-travel debugging.

```bash
pnpm run e2e:docker:ui            # Docker environment with UI mode
pnpm run e2e:ui                   # Local dev environment with UI mode
```

### Docker environment management

| Command | Description |
|---------|-------------|
| `pnpm run e2e:env:start` | Start Docker test environment |
| `pnpm run e2e:env:stop` | Stop Docker test environment |
| `pnpm run e2e:env:status` | Show Docker service status |
| `pnpm run e2e:env:logs` | Tail Docker service logs |
| `pnpm run e2e:env:check` | Verify Docker e2e environment is ready |

### Reports

| Command | Description |
|---------|-------------|
| `pnpm run e2e:report` | Open the last HTML report |

### From the monorepo root

```bash
# See the "Test execution modes" section above for all available commands
```

### Running a subset of tests

```bash
# Single spec file
pnpm exec playwright test tests/e2e/specs/mot/navigation.spec.ts

# Tests matching a title pattern
pnpm exec playwright test -g "should navigate to Bus Stops"

# A specific project (browser)
pnpm exec playwright test --project=chromium
```

---

## Environment configuration

Copy `.env.example` to `.env` inside `tests/e2e/` and fill in the values:

```bash
cp tests/e2e/.env.example tests/e2e/.env
```

| Variable | Docker e2e value | Dev value | Description |
|----------|-----------------|-----------|-------------|
| `BASE_URL` | `http://localhost:3000` | `http://localhost:3000` | Management portal URL |
| `API_URL` | **`http://localhost:8081`** | `http://localhost:8080` | Backend API URL |
| `ASGARDEO_TEST_USERNAME` | — | — | Asgardeo MOT test user email |
| `ASGARDEO_TEST_PASSWORD` | — | — | Asgardeo MOT test user password |
| `HEADED` | `false` | `false` | Set to `true` to show browser UI during tests |
| `SLOW_MO` | `0` | `0` | Milliseconds to slow down operations (e.g., `500`, `1000`) |

> The `API_URL` is automatically forwarded to the Next.js dev server as
> `NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL`, so the browser-side API calls go to
> the correct backend without any manual change to the management portal's
> `.env` file.

**Configuration via environment variables:**

You can also configure test execution directly via environment variables without
editing the `.env` file:

```bash
# Run in headed mode
HEADED=true pnpm run e2e:docker

# Run with 800ms slowdown
SLOW_MO=800 pnpm run e2e:docker

# Combine headed mode with slowdown
HEADED=true SLOW_MO=500 pnpm run e2e:docker

# Or use the convenience scripts
pnpm run e2e:docker:headed        # HEADED=true
pnpm run e2e:docker:slow          # HEADED=true SLOW_MO=500
```

---

## How the Docker environment works

### Services (`docker-compose.e2e.yml`)

**`postgres`** — PostgreSQL 16 on host port `5433`
- Dedicated database `busmate_e2e` entirely separate from dev
- Health-checked before the backend starts

**`backend`** — Spring Boot API on host port `8081`
- Built from source via `apps/backend/api-core/Dockerfile.e2e` (multi-stage)
- Runs with `SPRING_PROFILES_ACTIVE=e2e`
- Profile `application-e2e.yml` sets `ddl-auto: create-drop` — schema is
  created fresh on startup and dropped on shutdown
- Health-checked at `/actuator/health` before Playwright starts

### Lifecycle

```
pnpm run e2e:env:start
  └── docker compose up -d --build
        ├── postgres  → starts, health-checked
        └── backend   → waits for postgres, starts, health-checked
              └── Spring Boot creates a fresh schema (ddl-auto: create-drop)

pnpm run e2e:docker
  └── E2E_DOCKER=true playwright test
        ├── webServer: starts Next.js dev server on port 3000
        │             with NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL=http://localhost:8081
        ├── globalSetup: authenticates via Asgardeo, saves storage state
        ├── [tests run sequentially against http://localhost:3000]
        └── globalTeardown: logs completion

pnpm run e2e:env:stop
  └── docker compose down -v
        └── removes containers + named volume (e2e_postgres_data)
              → zero test data remains
```

### Ports at a glance

```
localhost:3000   Next.js management portal  (managed by Playwright webServer)
localhost:8081   Spring Boot test backend   (Docker container)
localhost:5433   PostgreSQL test database   (Docker container)
```

None of these conflict with the standard development ports (3000/8080/5432).

> **Note:** Port 3000 is shared with the dev Next.js server. Ensure your
> development server is not running before executing `pnpm run e2e:docker`, or
> use a different terminal profile for test runs.

---

## Test structure

```
tests/e2e/
├── specs/mot/
│   ├── navigation.spec.ts              Navigation smoke tests
│   └── bus-stops/
│       ├── bus-stops-crud.spec.ts      CRUD operations (serial suite)
│       ├── bus-stops-filters.spec.ts   Filter, search, pagination
│       └── bus-stops-import-export.spec.ts
├── page-objects/mot/
│   ├── dashboard.page.ts
│   ├── components/                     Reusable component objects
│   └── bus-stops/
├── fixtures/
│   └── base.fixture.ts                 Custom test fixture with injected page objects
├── utils/
│   ├── api-helpers.ts                  Axios helpers for direct backend calls
│   ├── constants.ts                    URLs, timeouts, API patterns
│   ├── test-data-factory.ts            Test data generators
│   └── wait-helpers.ts
├── auth/
│   └── storage-state.json              Cached Asgardeo session (git-ignored)
├── scripts/
│   └── e2e-env.sh                      Docker environment manager
├── global-setup.ts                     Asgardeo authentication setup
├── global-teardown.ts                  Post-run cleanup notes
├── playwright.config.ts
├── .env                                Local config (git-ignored)
├── .env.example                        Configuration template
└── README.md                           This file
```

---

## Writing new tests

1. Create a new spec file under `specs/mot/your-feature/`.
2. Import the custom `test` fixture from `fixtures/base.fixture.ts` (not
   `@playwright/test` directly) to get injected page objects.
3. Prefix all test-created records with `TEST_PREFIX` from `utils/constants.ts`
   (`E2E_TEST_`) so they are easy to identify.
4. For CRUD suites that depend on execution order, wrap in
   `test.describe.serial()`.

```typescript
import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_PREFIX } from '../../utils/constants.js';

test.describe.serial('My feature', () => {
  test('should do something', async ({ myPage }) => {
    // ...
  });
});
```

---

## CI / CD

When `CI=true` is set (standard in GitHub Actions and most CI systems):

- Playwright retries each failing test up to **2 times**
- `reuseExistingServer` is disabled — a fresh Next.js dev server is always
  started
- `forbidOnly` is enabled — `test.only` left in source will fail the build

Recommended CI job steps:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium

- name: Start e2e environment
  run: pnpm run e2e:env:start

- name: Run e2e tests
  run: pnpm run e2e:docker

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: tests/e2e/playwright-report/

- name: Stop e2e environment
  if: always()
  run: pnpm run e2e:env:stop
```

---

## Troubleshooting

### `e2e:env:start` — backend health check times out

```bash
# Check what went wrong
pnpm run e2e:env:logs
# or filter to just the backend
bash tests/e2e/scripts/e2e-env.sh logs backend
```

Common causes:
- **Port conflict**: another process is already using `8081` or `5433`.
  Run `lsof -i :8081` / `lsof -i :5433` to identify it.
- **Build failure**: the Maven build inside Docker failed. The logs will show
  the compilation error.
- **Slow first build**: the first build downloads Maven dependencies and
  compiles the source. This can take 3–5 minutes. Subsequent builds are fast
  due to Docker layer caching.

### Authentication fails (Asgardeo redirect loop)

- Verify `ASGARDEO_TEST_USERNAME` and `ASGARDEO_TEST_PASSWORD` in `tests/e2e/.env`.
- Ensure the test user exists in Asgardeo and has the **MOT** role assigned.
- Delete `tests/e2e/auth/storage-state.json` to force re-authentication.
- Check the screenshot saved to `tests/e2e/test-results/auth-failure.png`.

### Tests hit the wrong backend (wrong port)

Ensure `API_URL=http://localhost:8081` is set in `tests/e2e/.env`.
If a dev Next.js server on port 3000 is still running, stop it — `e2e:docker`
will always start a fresh server when `E2E_DOCKER=true` is set.

### System hangs or high resource usage when running `pnpm run e2e:docker`

**Symptoms:** Computer becomes unresponsive, CPU/memory usage spikes, tests never start.

**Cause:** The Next.js dev server (webServer) is getting stuck during startup, causing resource exhaustion.

**Solution (already implemented):**
- The Playwright config now uses webpack instead of Turbopack in Docker e2e mode
- Memory is limited to 4GB via `NODE_OPTIONS="--max-old-space-size=4096"`
- Timeout is set to 90 seconds for faster failure detection

**Additional checks:**
1. Ensure the Docker e2e environment is running first:
   ```bash
   pnpm run e2e:env:check
   ```
2. Kill any stuck Next.js processes:
   ```bash
   pkill -f "next dev"
   ```
3. Check if port 3000 is already in use:
   ```bash
   lsof -i :3000
   ```
4. Monitor the webServer startup in a separate terminal:
   ```bash
   tail -f /tmp/nextjs-test.log  # if logs are redirected
   ```

### Nuclear reset

```bash
# Stop environment and remove everything
pnpm run e2e:env:stop

# Remove cached auth state
rm -f tests/e2e/auth/storage-state.json

# Remove Docker build cache for the backend image
docker compose -f docker-compose.e2e.yml build --no-cache backend

# Start fresh
pnpm run e2e:env:start
```
