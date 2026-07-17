# Local Development Quickstart

Get the whole BusMate platform — all three backend services, the API gateway, and the frontend
apps — running locally against a seeded database, in one pass. Aimed at a newcomer's first run.

See also: [`docs/busmate-platform-run-guide.md`](busmate-platform-run-guide.md) (ports/health-check
reference), [`docs/dev-seed-credentials.md`](dev-seed-credentials.md) (full login list),
[`docs/dev-seed-contract.md`](dev-seed-contract.md) (how the demo data lines up across services),
[`docs/plans/Database-Migrations-and-Seed-Data-Plan.md`](plans/Database-Migrations-and-Seed-Data-Plan.md)
(how the migrations/seed pipeline works under the hood).

## Prerequisites

- **Node.js ≥ 20**, **pnpm ≥ 10** (`corepack enable` picks up the pinned `pnpm@10.26.1` from
  `package.json`)
- **Java 17**
- **Docker** and **Docker Compose**
- `config/secrets/.env` present (holds `SUPABASE_JWT_SECRET`, `INTERNAL_API_KEY`, etc.) — already
  committed as safe local-dev defaults; you don't need to create it yourself

## Ports at a glance

| Service | Port | Role |
|---|---:|---|
| `api-gateway` | `8080` | Main entry point — every frontend calls this |
| `core-service` | `9010` | Routes, schedules, stops, fleet, permits |
| `user-service` | `9020` | Auth, users, RBAC, profiles |
| `ticketing-service` | `9030` | Tickets, fares, trip summaries |
| Postgres (dev) | `5433` | One instance, three databases: `busmate_user`, `busmate_core`, `busmate_ticketing` |

Frontends always talk to the gateway (`http://localhost:8080`), never to a backend service
directly.

## Step 1 — Install workspace dependencies

```bash
cd busmate
pnpm install
```

## Step 2 — Start the database

```bash
pnpm run db:dev:reset   # drops any existing volume, starts postgres, creates the 3 empty databases
```

Use `pnpm run db:dev:up` instead if you just want Postgres up without wiping existing data. Either
way, the databases start **empty** — schema, reference data (RBAC, permissions), and the Sri Lankan
demo dataset all load automatically the first time each backend service boots, via Flyway. There is
no separate seed script to run.

## Step 3 — Start the backend

Pick one of these two paths.

### Option A — everything in Docker (closest to how it's deployed)

```bash
pnpm run build:user-service
pnpm run build:core-service
pnpm run build:ticketing-service
pnpm run dev:backend        # docker compose up --build — postgres + all 3 services + gateway
```

### Option B — services on the host (faster iteration; one terminal each)

```bash
pnpm run dev:user-service      # :9020 — migrates & seeds busmate_user on first boot
pnpm run dev:core-service      # :9010 — migrates & seeds busmate_core
pnpm run dev:ticketing-service # :9030 — migrates & seeds busmate_ticketing
pnpm run dev:api-gateway       # :8080
```

Either way, each Spring service defaults to the `dev` profile and connects to `localhost:5433`.
Watch a service's startup log for lines like `Migrating schema "public" to version "001 - baseline"`
followed by `Migrating schema "public" with repeatable migration "900 demo users"` — that's Flyway
laying down schema, then reference data, then the demo seed, in that order.

## Step 4 — Verify it's up and seeded

```bash
curl http://localhost:8080/health            # gateway
curl http://localhost:8080/api/health         # core-service through the gateway

# Row counts sanity check (12 demo users, 3 demo operators expected):
docker compose exec postgres psql -U postgres -d busmate_user -c "select count(*) from users;"
docker compose exec postgres psql -U postgres -d busmate_core -c "select count(*) from operator;"
```

A real login against the seeded admin account:

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@busmate.test","password":"Admin@2026"}'
```

A `200` with an access token back means the whole chain — gateway → user-service → Postgres →
bcrypt verification — is working.

## Step 5 — Start the frontends

Run whichever ones you need, each in its own terminal:

```bash
pnpm run dev:new-react-portal    # Vite — admin / operator / timekeeper / MOT dashboard
pnpm run dev:passenger-web       # Vite — passenger-facing web app (:4000)
pnpm run dev:passenger-mobile    # Expo — scan the printed QR with Expo Go
pnpm run dev:conductor-mobile    # Expo — conductor app, scan the printed QR
```

Each app's `.env` already points its API base URL at `http://localhost:8080` — no per-app
configuration needed for local dev. Check each terminal's own output for its actual serving URL,
since Next.js/Vite/Expo pick their own default ports.

## While it's running

Only relevant if you started the backend with **Option A (Docker)** — Option B's services print
straight to the terminal you launched them in, so their logs/status are just that terminal.

```bash
pnpm run dev:backend:status   # what's running, ports, health (docker compose ps)
pnpm run dev:backend:logs     # tail every service's logs (Ctrl+C to stop watching, doesn't stop them)
```

Add a service name to `dev:backend:logs`'s underlying command to filter to one service, e.g.
`docker compose logs -f user-service`.

## Stopping everything

**Backend — Option A (Docker):**

```bash
pnpm run dev:backend:down     # docker compose down — stops & removes the containers
```

This does **not** delete the Postgres volume, so your seeded data survives — the next
`dev:backend` picks up right where you left off, no re-seeding needed.

**Backend — Option B (host processes):** `Ctrl+C` in each service's terminal. If a terminal was
closed instead of `Ctrl+C`'d and a port is still stuck (`address already in use` on your next
`dev:backend`/`dev:*-service` run), find and stop the orphaned process:

```bash
lsof -i :9020          # or :9010 / :9030 / :8080 — whichever port is stuck
kill <PID>
```

**Frontends:** `Ctrl+C` in each app's terminal — there's no container lifecycle for these in dev
(Next.js/Vite/Expo run directly for fast hot-reload), so that's the only "down" they need.

**Database only** (leave services running, just stop Postgres):

```bash
pnpm run db:dev:down    # docker compose stop postgres — keeps the volume, just stops the container
```

## Resetting

```bash
pnpm run db:dev:reset
```

Then restart whichever backend services you're running — they'll re-migrate and re-seed a clean
copy automatically. Restarting a service against an *already-seeded* database is also safe and
does **not** duplicate rows (the seed migrations are idempotent).

## Command reference

| Purpose | Command |
|---|---|
| Start full backend (Docker) | `pnpm run dev:backend` |
| Backend status / ports / health | `pnpm run dev:backend:status` |
| Tail backend logs | `pnpm run dev:backend:logs` |
| Stop full backend (Docker) | `pnpm run dev:backend:down` |
| Start one backend service (host) | `pnpm run dev:user-service` / `dev:core-service` / `dev:ticketing-service` / `dev:api-gateway` |
| Stop one backend service (host) | `Ctrl+C` in its terminal |
| Start a frontend app | `pnpm run dev:new-react-portal` / `dev:passenger-web` / `dev:passenger-mobile` / `dev:conductor-mobile` |
| Stop a frontend app | `Ctrl+C` in its terminal |
| Start Postgres only | `pnpm run db:dev:up` |
| Stop Postgres only (keeps data) | `pnpm run db:dev:down` |
| Wipe & recreate Postgres (empty) | `pnpm run db:dev:reset` |
| Open a psql shell | `pnpm run db:dev:psql` |
| Postgres GUI (DbGate) | `pnpm run db:dev:gui` / `db:dev:gui:down` |

---

## What's in the seeded database

**Login accounts** — every email is `@busmate.test` (a non-deliverable, IANA-reserved test domain);
passwords follow `{Role}{N}@2026`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@busmate.test` | `Admin@2026` |
| MOT | `mot@busmate.test` | `Mot@2026` |
| Timekeeper | `timekeeper@busmate.test` | `Timekeeper@2026` |
| Operator — Lanka Suwaseriya Travels (Colombo–Kandy) | `operator.suwaseriya@busmate.test` | `Operator1@2026` |
| Operator — Southern Comfort Express (Colombo–Galle) | `operator.southerncomfort@busmate.test` | `Operator2@2026` |
| Operator — SLTB Central Province (Colombo–Negombo) | `operator.sltbcentral@busmate.test` | `Operator3@2026` |
| Conductor — Saman Kumara (Suwaseriya) | `conductor.saman@busmate.test` | `Conductor1@2026` |
| Conductor — Nirosha Fernando (Southern Comfort) | `conductor.nirosha@busmate.test` | `Conductor2@2026` |
| Conductor — Ranjith Silva (SLTB) | `conductor.ranjith@busmate.test` | `Conductor3@2026` |
| Passenger — Dilani Perera | `passenger.dilani@busmate.test` | `Passenger1@2026` |
| Passenger — Kasun Mendis | `passenger.kasun@busmate.test` | `Passenger2@2026` |
| Passenger — Ishara Gunawardena | `passenger.ishara@busmate.test` | `Passenger3@2026` |

Full list with notes: [`docs/dev-seed-credentials.md`](dev-seed-credentials.md).

**The scenario:** three bus operators, each running one real Sri Lankan route with two buses, one
permit, and one assigned conductor, across nine real stops (Colombo Fort, Kadawatha, Kegalle, Kandy,
Kalutara, Ambalangoda, Galle, Wattala, Negombo). Each route has a daily schedule and two trips —
**yesterday** (completed) and **today** (pending), computed relative to `CURRENT_DATE` so the data
never goes stale. ticketing-service adds demo fares and six tickets against today's trips.

| Operator | Route | Buses | Permit |
|---|---|---|---|
| Lanka Suwaseriya Travels | Colombo Fort ↔ Kandy | `WP CAA-4521` TATA LP 1613 · `WP CAB-7734` Ashok Leyland Viking | `PVT-SUW-2026-001` (SEMI_LUXURY) |
| Southern Comfort Express | Colombo Fort ↔ Galle (expressway) | `SP CAA-2210` Rosa Coaster · `SP CAB-9981` Yutong ZK6122 | `PVT-SCE-2026-001` (LUXURY) |
| SLTB – Central Province | Colombo Fort ↔ Negombo | `CP NA-1123` · `CP NA-1187` TATA LP 1613 (SLTB) | `SLTB-CP-2026-001` (NORMAL) |

---

## Test scenarios

Each scenario works through the UI or directly against the gateway API. For API calls, get a token
first:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@busmate.test","password":"Admin@2026"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')
```

(Inspect one login response to confirm the exact token field name before scripting further calls.)

### 1. Admin — user & RBAC management
Login as `admin@busmate.test` in new-react-portal, or:
```bash
curl -s http://localhost:8080/api/users       -H "Authorization: Bearer $TOKEN"   # expect 12
curl -s http://localhost:8080/api/user-types  -H "Authorization: Bearer $TOKEN"   # expect 6
curl -s http://localhost:8080/api/permissions -H "Authorization: Bearer $TOKEN"   # expect 28
```

### 2. Operator — fleet, permit & route
Login as `operator.suwaseriya@busmate.test` in new-react-portal; expect their 2 buses, permit
`PVT-SUW-2026-001`, and the Colombo Fort ↔ Kandy route.
```bash
curl -s http://localhost:8080/api/operators -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8080/api/buses     -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8080/api/permits   -H "Authorization: Bearer $TOKEN"
```

### 3. Routes, stops & trips (public reads)
```bash
curl -s http://localhost:8080/api/routes     # expect 6 (3 outbound + 3 inbound)
curl -s http://localhost:8080/api/stops      # expect 9
curl -s http://localhost:8080/api/schedules
curl -s http://localhost:8080/api/trips      # note today's pending trip per route
```

### 4. Passenger — browse & book
Login as `passenger.dilani@busmate.test` in passenger-web; search Colombo Fort → Kandy, open
today's trip, view the fare, and see her existing seeded online ticket on the Kandy line.

### 5. Conductor — today's trip
Login as `conductor.saman@busmate.test` in conductor-mobile; Saman is assigned to Suwaseriya's
Colombo–Kandy trip — issue or validate a ticket against today's trip.

### 6. Ticketing — fares & tickets
Expect demo base fares (Kandy ≈ 120, Galle ≈ 145, Negombo ≈ 35) and 6 seeded tickets (one cash + one
online per route).
```bash
curl -s http://localhost:8080/api/v1/baseFare  -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8080/api/v1/routeFare -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8080/api/v1/tickets   -H "Authorization: Bearer $TOKEN"
```

### 7. Cross-service consistency
Log in as `operator.suwaseriya` (user-service) and confirm the *same* operator owns the buses in
core-service and appears on the tickets in ticketing-service. The three independently-seeded
databases line up because they share a registry of fixed demo UUIDs — see
[`docs/dev-seed-contract.md`](dev-seed-contract.md) for how.
