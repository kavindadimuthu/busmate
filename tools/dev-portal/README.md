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
- **Live status** — each node shows one chip per environment: **green** = running (health/
  port probe), **blue** = running in Docker (`dev`/`prod`/`e2e`/`obs`), **amber** =
  starting, **dim** = down.
- **Run / stop menus** — the **⋯** button on a node opens a per-environment menu. `local`
  starts the service via its `pnpm dev:*` script (a managed process); `dev`/`prod`/`obs`
  start it via `docker compose`. Stop works for both.
- **Draggable layout + reset** — drag any component to rearrange; positions persist in
  `localStorage`. **Reset layout** returns everything to the registry default.

## Tech stack

| Layer | Tech |
|---|---|
| Server | **Express** (Node, ESM) — status, lifecycle & log endpoints; serves the built UI |
| Detection | `docker ps`/`inspect` + HTTP/TCP health probes |
| Process control | `child_process` process manager (spawn, track, **tree-kill** via process groups) for `pnpm` services; `docker compose up/stop` for containers |
| UI | **Vite + React 19 + TypeScript + @xyflow/react** (ReactFlow), bundled locally — no CDN, works offline |

## How start/stop works

`services.config.mjs` gives each service an `actions` map of `env → descriptor`:

- `pnpm('dev:core-service')` → the server spawns `pnpm run dev:core-service` as a managed,
  tracked process. **Stop** kills the whole process group (`pnpm → nx → vite`/`mvnw → java`),
  so nothing is orphaned. Managed-process state is in-memory: if you restart the portal
  itself, previously spawned services keep running but are no longer tracked.
- `compose('core-service', { file, build })` → the server runs
  `docker compose [-f file] up -d [--build] <service>` / `stop <service>`. Docker owns the
  lifecycle; the portal is stateless for these.

Commands are built **only** from the registry descriptor and a registry-validated
`:id/:env` — never from raw request input. The server binds to **127.0.0.1 only**, since
it can start/stop processes and containers.

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
| `services.config.mjs` | Registry: tiers, nodes, ports, envs, edges, **actions** |
| `server/index.mjs` | Express app: `/api/status`, start/stop/logs endpoints, static UI |
| `server/probe.mjs` | Docker + health/port detection (overlays managed-process state) |
| `server/processManager.mjs` | Spawn / track / tree-kill managed `pnpm` processes |
| `server/actions.mjs` | Dispatches start/stop to pnpm vs docker compose |
| `web/` | Vite + React + TS app (`src/`, built to `web/dist`) |
