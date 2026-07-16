# dev-portal — live topology dashboard

A local, zero-build developer dashboard that shows **which BusMate components are
running right now, in which environment, and how they connect** — laid out like an
architecture diagram (labelled tiers + a request-flow spine).

```bash
pnpm dev-portal          # → http://localhost:4321
```

Open the URL; the graph auto-refreshes every 5 seconds.

## What it shows

Six tier containers arranged as a top-to-bottom request flow, with observability as a
side rail:

```
Client applications  ─►  Edge (api-gateway)  ─►  Backend services  ─►  Data stores
                                                                        Internal tools
                                                            Observability (side rail)
```

Each node shows a status dot, its stack/port, and one **environment chip per env** it
can run in:

- **lit green chip** — running (detected by a direct health/port probe → `local`)
- **lit blue chip** — running in a Docker container, labelled `dev` / `prod` / `e2e`
  / `obs` from the container's `SPRING_PROFILES_ACTIVE` / compose project
- **dim chip** — that environment is not running

Edges are solid animated green when both ends are up, and dashed/grey when down or for
observability (OTLP / scrape) paths.

## How status is detected

Two signals are merged (see [`server/probe.mjs`](server/probe.mjs)):

1. **Docker** — `docker ps` + `docker inspect` finds containers and reads their env so
   dev/prod/e2e can be told apart even when they share a host port. Degrades gracefully
   (a banner) when the Docker daemon isn't reachable.
2. **Health/port probe** — a direct HTTP/TCP hit on each component's conventional dev
   port. Catches anything started with `pnpm dev` / `nx dev` outside a container.

## Configuration

The registry — nodes, ports, canvas layout, environments, and dependency edges — lives
in [`services.config.mjs`](services.config.mjs). Every port can be overridden with an
env var without editing code, e.g.:

```bash
MGMT_PORTAL_PORT=3100 DEV_PORTAL_PORT=4400 pnpm dev-portal
```

## Layout

| File | Role |
|---|---|
| `services.config.mjs` | Registry: tier frames, nodes, ports, envs, edges |
| `server/probe.mjs` | Docker + health/port detection |
| `server/index.mjs` | Zero-dependency HTTP server (`/api/status`, static UI) |
| `web/` | ReactFlow dashboard (React + ReactFlow via esm.sh — no build step) |
