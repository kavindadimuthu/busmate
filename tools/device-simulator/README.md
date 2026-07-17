# Device Simulator

Replays a bus moving along one of the demo routes, POSTing real GPS fixes to telemetry-service's
`/ingest/v1/location` endpoint through the API gateway. This is the IoT platform's load-test and
demo rig ([`docs/plans/IoT-Platform-Layer-Plan.md`](../../docs/plans/IoT-Platform-Layer-Plan.md),
Phase 2) — it exercises the exact same pipeline a real GPS tracker or the conductor app uses, with
zero hardware.

Plain Node script, no dependencies (uses the built-in `fetch`) — nothing to install.

## Prerequisites

The dev stack running with the demo seed loaded (`pnpm dev:backend`, or `api-gateway` +
`telemetry-service` + Postgres + Redpanda running locally) — see
[`docs/dev-iot-device-credentials.md`](../../docs/dev-iot-device-credentials.md) for the seeded
device tokens this script defaults to.

## Usage

```bash
# Defaults: Colombo–Kandy route, the GPS-DEMO-4521 demo token, http://localhost:8080, 10s/fix
node tools/device-simulator/simulate.mjs

# A different demo route (see routes.mjs for the full list)
node tools/device-simulator/simulate.mjs --route=colombo-galle --token=bmt_devseed_03_9ecbe505e29ef2191550d253

# Compress the whole route into a faster demo run (10x playback speed)
node tools/device-simulator/simulate.mjs --speed=10

# Run through the route once instead of looping
node tools/device-simulator/simulate.mjs --loop=false

# Point at a non-default gateway
node tools/device-simulator/simulate.mjs --gateway=http://localhost:8080
```

| Flag | Default | Meaning |
|---|---|---|
| `--route` | `colombo-kandy` | Key into `routes.mjs` |
| `--token` | one of the seeded demo tokens | Device bearer token |
| `--gateway` | `http://localhost:8080` | API gateway base URL |
| `--interval` | `10` | Seconds between fixes |
| `--speed` | `1` | Playback speed multiplier (higher = faster demo) |
| `--loop` | `true` | Repeat the route indefinitely |

Speed and heading are computed from the great-circle distance and bearing between consecutive
waypoints, so the reported `speedKmh`/`headingDeg` are geometrically consistent with the fixes —
useful for exercising the ingest pipeline's plausibility checks realistically.

Run two instances with different `--route`/`--token` pairs (see the demo device table in
`docs/dev-iot-device-credentials.md`) to simulate multiple buses moving at once.
