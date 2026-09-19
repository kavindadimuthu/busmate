# telemetry-service

BusMate's IoT / device-telemetry ingestion service. Owns the device registry, protocol adapters,
normalization, and the live-state store; publishes normalized events to Kafka/Redpanda for the rest
of the platform to consume. See [`docs/plans/IoT-Platform-Layer-Plan.md`](../../../docs/plans/IoT-Platform-Layer-Plan.md).

**Status:** Phase 0 scaffold — service, broker wiring, Flyway pipeline, and Kafka topics are in
place. Device registry, ingestion, and live-state APIs arrive in later phases.

## Ports & infrastructure

| Concern | Dev value |
|---|---|
| HTTP | `9040` |
| Database | `busmate_telemetry` on the shared dev Postgres (`localhost:5433`) |
| Broker | Redpanda (`localhost:9092` from host, `redpanda:9092` in Docker) |
| Topics | `iot.telemetry.v1`, `iot.device-status.v1`, `iot.telemetry.dlq.v1` (auto-created on startup) |

## Run locally

```bash
# Start dev infra (Postgres + Redpanda) and the service
docker compose up -d postgres redpanda
cd apps/backend/telemetry-service && ./mvnw spring-boot:run
# or the whole backend stack:  pnpm dev:backend

curl localhost:9040/api/telemetry/info      # { service, status, topics }
curl localhost:9040/actuator/health
```

## Database roles and row-level security

Vehicle health (`bus_vehicle_state`, `bus_active_alert`) is operator-scoped and protected by
**row-level security** (INC-024, [ADR-016](../../../intent/decisions/ADR-016-runtime-database-role-cannot-bypass-row-level-security.md)).
That only works if the service does not connect as a role that can skip the policies, so it uses two:

| Role | Used for | Configured by |
|---|---|---|
| owner (`postgres` in dev) | Flyway migrations, and owns the tables | `spring.flyway.user` / `TELEMETRY_DB_MIGRATION_*` |
| runtime (`busmate_telemetry_app` in dev) | every request; not a superuser, no `BYPASSRLS`, owns nothing | `spring.datasource.*` / `TELEMETRY_DB_*` |

The service **refuses to start** if its runtime role is a superuser, bypasses RLS or owns those tables.
A fresh dev Postgres volume creates the runtime role from `scripts/postgres/init-dev-dbs.sql`; an
existing one needs, once:

```bash
docker exec -i busmate-dev-postgres psql -U postgres -v app_user=busmate_telemetry_app \
  -v app_password=busmate_telemetry_app < scripts/postgres/provision-telemetry-app-role.sql
```

Staff and operators read vehicle health through `GET /api/vehicles/state` and
`GET /api/vehicles/{busId}/state` (via the gateway). MOT and admin see every bus, an operator sees only
their own, everyone else is refused; another operator's bus answers exactly like a missing one.

## Production

Set `TELEMETRY_DB_URL` / `TELEMETRY_DB_USERNAME` / `TELEMETRY_DB_PASSWORD` in `config/secrets/.env`
(service-scoped, like the other services). `docker-compose.production.yml` runs the service with
`SPRING_PROFILES_ACTIVE=prod` against the `redpanda` service (or a managed Kafka — see that file).

## Tests

`./mvnw verify` boots a real Postgres via Testcontainers and an embedded Kafka broker, runs the
actual Flyway migrations, and asserts the context, HTTP surface, and topic provisioning. Wired into
the Backend CI gate (`.github/workflows/backend-ci.yml`).
