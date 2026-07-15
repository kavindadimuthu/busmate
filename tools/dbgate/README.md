# DbGate — local dev database GUI

[DbGate Community](https://dbgate.io) is a free, self-hosted database GUI. This container
gives every dev a table browser / SQL editor pre-wired to the local dev Postgres (the
`postgres` service in the root `docker-compose.yml`) with zero manual setup — no more
configuring your own client by hand against `busmate_user` / `busmate_core` /
`busmate_ticketing`.

This is a **local development convenience only**. See "Security notes" below.

## Prerequisite

Dev Postgres must already be running and published on the host:

```bash
pnpm db:dev:up
```

DbGate connects to it via `host.docker.internal:5433` (the host-published port), not the
app stack's internal Docker network — it's an independent Compose project, the same
pattern `docker-compose.observability.yml` uses. If dev Postgres isn't running, DbGate
will start fine but the pre-wired connection will fail to connect.

## Running it

```bash
pnpm db:dev:gui         # start (http://localhost:3002)
pnpm db:dev:gui:logs    # follow logs
pnpm db:dev:gui:down    # stop
```

Or directly:

```bash
docker compose -f tools/dbgate/docker-compose.yml up -d
docker compose -f tools/dbgate/docker-compose.yml logs -f dbgate
docker compose -f tools/dbgate/docker-compose.yml down
```

Open **http://localhost:3002**. A connection called **"BusMate Dev Postgres"** is
pre-configured and will list all three dev databases.

## Ports

| Service | URL | Note |
|---|---|---|
| DbGate | http://localhost:3002 | Bound to `127.0.0.1` only (see below) |

Port 3002 was chosen because 3000 (Grafana) and 3001 (Uptime Kuma) are already taken by
`docker-compose.observability.yml`.

## Pre-wired connection

| Field | Value |
|---|---|
| Label | BusMate Dev Postgres |
| Host | `host.docker.internal` (→ your machine's `localhost:5433`) |
| User / password | `postgres` / `postgres` (same throwaway dev creds as root `docker-compose.yml`) |
| Databases visible | `busmate_user`, `busmate_core`, `busmate_ticketing` |

## Persistence

Saved queries and UI preferences persist in the named volume `busmate_dbgate_data`
(mounted at `/root/.dbgate` in the container) across `db:dev:gui:down` / `db:dev:gui`
cycles. To wipe it:

```bash
docker compose -f tools/dbgate/docker-compose.yml down -v
```

## Enabling login

DbGate has no login by default here — acceptable since the port is bound to `127.0.0.1`
only. If you want a login prompt anyway (e.g. a shared dev machine with multiple local
users):

```bash
cp tools/dbgate/.env.example tools/dbgate/.env
# edit tools/dbgate/.env with a real password
```

Then in `docker-compose.yml`, uncomment the `LOGIN`/`PASSWORD` environment lines and the
`env_file` block. `tools/dbgate/.env` is gitignored by the repo's root `*.env` pattern.

## Security notes

- **Dev-only.** This container must never be added to `docker-compose.production.yml` or
  any CI/CD pipeline.
- **Never point it at Supabase or any production database.** The pre-wired connection
  only ever uses the throwaway dev Postgres credentials already hardcoded in the root
  `docker-compose.yml`. No value from `config/secrets/.env` is used or should be added
  here.
- **Full read/write access.** DbGate is a GUI, not a read-only viewer — it can `DROP
  TABLE` in the dev databases. That's fine for disposable dev data
  (`pnpm db:dev:reset` recreates it), but don't assume it's safe against anything real.
- **Localhost-bound port.** The compose file publishes `127.0.0.1:3002:3000`, not
  `3002:3000`, so it isn't reachable from other machines on the network by default.
- **Pinned image version** (`dbgate/dbgate:7.2.1`, not `:latest`) so upstream changes
  don't silently land in dev environments.

## Troubleshooting

- **Connection fails / "could not connect to server"** — confirm `pnpm db:dev:up` is
  running (`docker compose ps postgres`) and that port 5433 is actually published on the
  host (`docker compose port postgres 5432`).
- **`host.docker.internal` not resolving** — this repo already depends on the same
  `extra_hosts: host.docker.internal:host-gateway` trick for the observability stack to
  reach app services (see the root `docker-compose.yml` header comment); it's a Linux
  Docker Engine feature added via `extra_hosts`, and should work anywhere the app stack's
  own OTLP export already does.
- **Port 3002 already in use** — stop whatever else is bound there or change the host
  side of the port mapping in `docker-compose.yml`.
