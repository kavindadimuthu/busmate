# Database Reset & Operator/Conductor Seed Guide

How to wipe stale operator/conductor test data and reseed a small, known set of Sri-Lankan-context operator and conductor profiles — reproducibly, with a single command, after restarting the platform's services.

Login list for the resulting accounts: [`docs/operator-conductor-seed-credentials.md`](operator-conductor-seed-credentials.md).

## Background: there is no local/ephemeral database for normal dev

Unlike the Playwright e2e stack (`docker-compose.e2e.yml`, its own throwaway Postgres container), the platform's normal dev setup has **no local database at all** — `docker-compose.yml` only runs `api-gateway`, `core-service`, `user-service`, `ticketing-service`, each connecting directly to a hosted Supabase Postgres project. "Resetting the database" here means clearing rows in that hosted project, not tearing down a container volume.

**There are two separate Supabase projects involved**, not one:

| | Project | Who connects to it | Contains |
|---|---|---|---|
| **user-service DB** | `gvxbzcxjueghvrtsfdxc` | user-service (`dev:user-service` loads the repo root `.env` via `dotenvx`) | `users`, `user_profiles`, `user_types`, `permissions`, `operator_sync_outbox` |
| **core-service DB** | `bixiyzllxffxqwutthmk` | core-service (`dev:core-service` does **not** load the root `.env` — it uses the fallback credentials hardcoded in `apps/backend/core-service/src/main/resources/application.yml`) | `operator`, `bus`, `passenger_service_permit`, `route`, `route_group`, `trip`, etc. |

This split exists because of a historical bug (see the `core_service_wrong_db_bug` note in project history) where core-service briefly wrote to user-service's project by mistake — that project still has a stale, disconnected leftover copy of some core-service tables. **Ignore that leftover copy.** The seed script below only ever touches the two real databases in the table above.

If you ever see `operator`/`bus` rows in the `gvxbzcxjueghvrtsfdxc` project with no `user_id` column at all, that's the stale leftover, not live data — don't try to clean it up as part of a normal reset.

## Prerequisites

- `psql` (PostgreSQL client) — used for direct table wipes/inserts
- `curl` and `jq` — used to call the Supabase Auth Admin API and core-service's internal API
- The repo root `.env` populated (`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_API_KEY`)
- **core-service running locally** (`pnpm run dev:core-service`, default `http://localhost:9010`) — operator rows are created through its live `/internal/operators` endpoint, not raw SQL, so the seed script needs it reachable. user-service does *not* need to be running (the script writes to its DB directly).

## Full reset workflow

1. **Stop all services** (if running):

   ```bash
   pnpm run compose:down
   # or, if you started them individually: Ctrl+C each `pnpm run dev:*` process
   ```

2. **Start the backend services you need** — at minimum core-service, since the seed script talks to its internal API:

   ```bash
   pnpm run dev:core-service     # in one terminal
   pnpm run dev:user-service     # optional — not required by the seed script itself,
                                  # but you'll want it running to actually log in afterward
   pnpm run dev:api-gateway      # optional — same, needed to log in through the normal flow
   ```

   Wait until core-service is healthy:

   ```bash
   curl http://localhost:9010/actuator/health
   ```

3. **Run the seed script** — this is the single command referenced above:

   ```bash
   pnpm run seed:operators
   ```

   What it does, in order:
   1. Wipes core-service's `trip`, `bus_passenger_service_permit_assignment`, `passenger_service_permit`, `bus`, and `operator` tables entirely (child-tables-first, so no FK errors).
   2. Finds every existing `operator`/`conductor` account in user-service, deletes each one's real Supabase Auth account via the Admin API, then deletes their `users` rows (`user_profiles` cascades automatically).
   3. Creates 3 new operator accounts and 2 new conductor accounts — each a real Supabase Auth signup + `users`/`user_profiles` rows + (for operators) a linked core-service `Operator` row created through the real `/internal/operators` sync endpoint.
   4. Creates 6 buses (2 per operator) and 3 passenger service permits (1 per operator, against existing route groups) so the fleet/route views aren't empty.

   It's fully idempotent — re-running it always deletes whatever operator/conductor data currently exists (including a previous run's seed data) and recreates the same fixed accounts fresh.

4. **Verify**:

   ```bash
   curl -s http://localhost:9010/api/operators/all | jq 'map({name, userId})'
   ```

   You should see exactly 3 operators, each with a non-null `userId`.

   Log in as one of the seeded accounts to confirm end-to-end:

   ```bash
   curl -s -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"operator.suwaseriya@busmate.test","password":"Operator1@2026"}' | jq '{accessToken: (.accessToken != null), userType}'
   ```

   Expect `{"accessToken": true, "userType": "operator"}`.

## What this script deliberately does *not* touch

- `admin`, `mot`, `timekeeper`, and `passenger` accounts in user-service — untouched.
- `route`, `route_group`, `schedule`, and `stop` data in core-service — untouched (permits are attached to *existing* route groups, not fabricated ones).
- Any other operator/conductor-adjacent data you've since created by hand through the app (e.g. if you used the seeded operator account to create more buses yourself) — re-running the script wipes **all** operator/conductor accounts and **all** core-service Operator/Bus/Permit rows, seeded or hand-created. Don't run it if you have real work-in-progress data in those tables you want to keep.

## Adding more profiles later

Edit [`scripts/seed-operator-conductor-profiles.sh`](../scripts/seed-operator-conductor-profiles.sh) directly — add more `create_operator_account` / `create_conductor_account` / `create_bus` / `create_permit` calls following the existing pattern near the bottom of the file, then update [`docs/operator-conductor-seed-credentials.md`](operator-conductor-seed-credentials.md) to match. The script currently has no data-file/loop indirection (kept intentionally simple for a small, fixed profile count) — just add more explicit calls.
