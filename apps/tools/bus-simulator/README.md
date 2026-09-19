# bus-simulator

A simulated bus for development and demos. It drives a real core-service route, reports position and
lifecycle through the telemetry ingest pipeline exactly as a tracker would, and is controlled from a
browser console that shows the bus's own state beside what the platform believes about it.

Intent: [INC-022](../../../intent/increments/INC-022-bus-simulator.md).

## Run

Needs the dev stack up with the demo seed loaded: `api-gateway`, `core-service`, `telemetry-service`,
Postgres and Redpanda (see the root [README](../../../README.md)).

```bash
pnpm --filter @busmate/bus-simulator dev      # server on :4600, console with hot reload on :4601
# or, one process serving a built console:
pnpm --filter @busmate/bus-simulator build && pnpm --filter @busmate/bus-simulator start
```

Options (`node src/server/main.ts --help`): `--gateway`, `--route <uuid>`, `--device <serial>`,
`--seed`, `--playback`, `--no-stream`, `--host`, `--port`. Route, bus and seed can also be changed
from the console.

```bash
pnpm --filter @busmate/bus-simulator test        # model tests, no stack needed
pnpm --filter @busmate/bus-simulator typecheck
```

## How it fits together

```
 console (React) ──HTTP/SSE──▶ simulator server ──▶ api-gateway ──▶ telemetry-service
                                 │  model (deterministic)   /ingest/v1/location, /device-status
                                 │                          /api/routes  (core-service)
                                 └──◀── /live/stream (staff-only SSE): what the platform sees
```

- **`src/core`** — the bus model. No I/O, no clock, no `Math.random`: fixed 0.1 s steps and a seeded
  generator, so a seed and a command sequence reproduce a run exactly.
- **`src/server`** — owns the wall clock and playback speed, publishes reports, watches the
  platform's live stream, serves the console API.
- **`src/console`** — the viewer and remote control.

## What is real and what is not

- **On the wire today:** position (`location`) and liveness (`device-status`), using the seeded demo
  device tokens in [docs/dev-iot-device-credentials.md](../../../docs/dev-iot-device-credentials.md).
- **Simulated but local only:** engine, fuel, tyres, battery, cabin, warnings. The platform has no
  event type for these yet (INC-023), so the console is the only place they are visible.
- **Straight-line legs.** core-service holds ordered stops with coordinates but no road geometry, so
  the bus cuts corners between stops.
- **Playback above 1×** speeds the model up, not the reporting: the platform receives at most one
  fix per second per device (its rate limit), so at 10× the newest fix wins and the rest are counted
  as coalesced.

## Safety

- Only ever talks to the gateway you point it at, with dev-seed credentials that authenticate only
  against a database carrying the dev seed. Never point it at a shared or production environment.
- The console has no authentication and can drive the bus. It binds to `127.0.0.1` by default and
  warns if you change that.
- The platform view signs in as the dev-seed MOT account (`BUS_SIM_STREAM_EMAIL` /
  `BUS_SIM_STREAM_PASSWORD` to override; `--no-stream` to skip).
