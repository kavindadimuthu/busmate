# dev-portal — live topology & control dashboard

A local developer dashboard that shows **which BusMate components are running, in which
environment, and how they connect** — laid out like an architecture diagram — and lets
you **start/stop them from the page** and **drag them into your own layout**.

```bash
pnpm dev-portal          # builds the UI, then serves it at http://localhost:4321
```

The graph auto-refreshes every 5 seconds.

## Features

- **Tiered topology** — components grouped into labelled containers (Clients → Edge →
  Backend services → Data, plus Observability and Internal tools), with dependency edges.
- **Live status (all environments)** — each node shows one chip per environment: **green**
  = running (health/port probe), **blue** = running in Docker, **dim** = down. `local`
  services run via `pnpm dev` are monitored here too.
- **Run / stop (containerized only)** — click a component to open its detail card, then
  Start/Stop any **Docker** environment (`dev`/`prod`/`obs`). See *Monitor vs control* below.
- **Draggable layout + reset** — drag any component to rearrange; positions persist in
  `localStorage`. **Reset layout** returns everything to the registry default.

## Monitor vs control

The portal **monitors every environment** but **controls only containerized ones**. This
is a deliberate scoping decision that keeps the tool simple and stateless:

- **Docker environments** (`dev`/`prod`/`e2e`/`obs`) are controlled with `docker compose`
  — the daemon owns the lifecycle, so the portal holds no process state and can restart
  freely without losing track of anything.
- **`local` (a service run directly via `pnpm dev`)** is **monitor-only**. The card shows
  whether it's up (via a port probe) but offers no Start/Stop — you control those in the
  terminal you ran them in, where the hot-reload logs and Ctrl-C already live. Trying to
  start/stop a `local` env via the API returns a clear "monitor-only" message.

A component with no controllable environment (the client apps, which only run `local`)
simply shows *monitor only* on every row.

## Tech stack

| Layer | Tech |
|---|---|
| Server | **Express** (Node, ESM) — status & lifecycle endpoints; serves the built UI. Stateless. |
| Detection | `docker ps`/`inspect` + HTTP/TCP health probes |
| Control | `docker compose up/stop` only — no process management, no state to keep |
| UI | **Vite + React 19 + TypeScript + @xyflow/react** (ReactFlow), bundled locally — no CDN, works offline |

## How start/stop works

`services.config.mjs` gives controllable services an `actions` map of `env → descriptor`.
Every descriptor is a Docker Compose command:

- `compose('core-service', { file, build })` → the server runs
  `docker compose [-f file] up -d [--build] <service>` to start and
  `docker compose [-f file] stop <service>` to stop. Docker owns the lifecycle, so the
  portal keeps **no process state** and can be restarted freely.

`local` environments have no descriptor and are monitor-only (see *Monitor vs control*).

Commands are built **only** from the registry descriptor and a registry-validated
`:id/:env` — never from raw request input. The server binds to **127.0.0.1 only**, since
it can start/stop containers.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev-portal` | Build UI + start server on :4321 (the normal way to use it) |
| `pnpm dev-portal:web` | Vite dev server on :5174 with HMR (proxies `/api` → :4321) for developing the portal itself; run the server separately with `pnpm --filter @busmate/dev-portal start` |
| `pnpm --filter @busmate/dev-portal typecheck` | Type-check the UI |

## Configuration

Node identity, canvas layout, environments, ports, dependency edges, and start/stop
actions all live in [`services.config.mjs`](services.config.mjs). Ports can be overridden
with env vars, e.g. `MGMT_PORTAL_PORT=3100 DEV_PORTAL_PORT=4400 pnpm dev-portal`.

## Layout

| Path | Role |
|---|---|
| `services.config.mjs` | Registry: tiers, nodes, ports, envs, edges, **actions** (Docker only) |
| `server/index.mjs` | Express app: `/api/status`, start/stop endpoints, static UI |
| `server/probe.mjs` | Docker + health/port detection |
| `server/actions.mjs` | Runs `docker compose up/stop` for a service+env |
| `web/` | Vite + React + TS app (`src/`, built to `web/dist`) |
