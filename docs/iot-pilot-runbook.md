# IoT Hardware Pilot Runbook

(IoT Platform Layer plan, Phase 4 — "pilot with 1–2 real GPS units on one route before fleet
rollout.") This is the operational checklist for that pilot: everything up to this point
(Phases 0–3, and the rest of Phase 4) has been built and verified in software — real hardware is
the one part of the plan that genuinely requires physical devices and a live network, so this
document is the runbook rather than a script that "does" the pilot.

## Prerequisites

- The app stack (`docker compose up -d`) and observability stack
  (`docker compose -f docker-compose.observability.yml up -d`) both running.
- 1–2 MQTT-capable GPS tracker units (or an MQTT-capable phone/dev board standing in for one, e.g.
  an ESP32 with a GPS module, or a phone running an MQTT client app for a dry run before real
  hardware arrives).
- Network reachability from the tracker's location to the EMQX broker's MQTT port (1883, or 8883
  for TLS — see "Exposing EMQX beyond the dev network" below).
- A demo bus and route already in the seed data (`docs/dev-seed-contract.md`), or a real
  bus/route/trip created via the MOT portal (`new-react-portal`, `/mot/buses` /
  `/mot/routes-fares/routes` / `/mot/schedules`).

## Step 1 — Register the device

Through the MOT portal (`new-react-portal`, `/mot/devices` — **not** `management-portal`, which is
deprecated) or directly against telemetry-service:

```bash
curl -X POST http://localhost:9040/api/devices \
  -H "Authorization: Bearer <staff JWT>" \
  -H "Content-Type: application/json" \
  -d '{"serialNumber": "PILOT-GPS-001", "deviceTypeCode": "GPS_TRACKER", "label": "Pilot unit 1"}'
```

Copy the returned `token` (`bmt_...`) — it is shown exactly once. Assign the device to the pilot
bus (`POST /api/devices/{id}/assignment`, body `{"busId": "<bus-uuid>"}`), same as any other
tracker.

## Step 2 — Configure the tracker

Two transports are supported; use whichever the hardware speaks natively — the ingest pipeline
(validation → enrichment → Kafka publish → live-state upsert → fleet health) is identical either
way.

**MQTT** (the expected path for real hardware trackers):
- Broker: `<host>:1883` (EMQX; TLS on 8883 if configured — not enabled by default, see below)
- Username: (anything — only the password is checked, same as the HTTPS path)
- Password: the device's `bmt_...` token
- Publish topic: `devices/{deviceId}/telemetry/location` (use the device's own `id` from Step 1,
  not its serial number)
- Payload (JSON, QoS 1):
  ```json
  {
    "deviceTimestamp": "2026-07-17T08:31:02Z",
    "sequenceNo": 1,
    "payload": { "lat": 6.9271, "lng": 79.8612, "speedKmh": 42, "headingDeg": 180 }
  }
  ```
  `sequenceNo` should increment on every fix from this device if the hardware can track one — it's
  what lets the pipeline reject re-delivered/out-of-order fixes (see Phase 4's idempotency note in
  the plan doc). If the tracker can't track a sequence, omit it; dedup is opt-in per device.

**HTTPS** (fallback, or for a quick dry run without MQTT hardware in hand):
```bash
curl -X POST http://localhost:8080/ingest/v1/location \
  -H "Authorization: Bearer <the device's bmt_ token>" \
  -H "Content-Type: application/json" \
  -d '{"deviceTimestamp": "2026-07-17T08:31:02Z", "sequenceNo": 1, "payload": {"lat": 6.9271, "lng": 79.8612, "speedKmh": 42}}'
```

## Step 3 — Watch it land

- **Grafana** (`http://localhost:3000`, dashboard "BusMate — IoT Telemetry Pipeline"): ingest rate
  should show a non-zero `accepted` series tagged `adapter="mqtt"` (or `"https"`) within a few
  seconds of the first fix; end-to-end latency panel should show the device-clock-to-ingest gap.
- **Live map** (`new-react-portal`, `/mot/tracking`): the pilot bus should show a real marker at
  the tracker's position once it's assigned to that bus and telemetry is flowing — this overlays
  onto the existing simulation the same way the two demo buses do (see the Phase 3 plan section).
- **`/mot/devices`**: `Last seen` should update on every accepted fix; `status` flips
  `PROVISIONED → ACTIVE` on the very first one.
- **EMQX dashboard** (`http://localhost:18083`, default login `admin`/`public` — **change this
  before exposing the port beyond localhost**): Connections panel shows the tracker's client
  connected; useful for confirming the device actually reached the broker at all before debugging
  further up the pipeline.

## Step 4 — Confirm fleet health works

Stop the tracker (or just stop publishing) and wait past the silence threshold
(`TELEMETRY_FLEET_HEALTH_SILENCE_MINUTES`, default 5 minutes). `/mot/devices` should show the
device flagged "Silent" within one `FleetHealthMonitorJob` tick (default every 60s) of the
threshold passing. Resume publishing — the flag should clear on the next accepted fix.

## Exposing EMQX beyond the dev network

The dev/prod compose files keep EMQX on the internal Docker network by default (production
doesn't publish 1883 at all — see `docker-compose.production.yml`'s comment on the `emqx`
service). For a pilot with hardware that isn't on the same LAN as the host:

- Simplest: a temporary `ports: ["1883:1883"]` mapping on a firewalled host, removed after the
  pilot.
- Better: a VPN (WireGuard/Tailscale) between the tracker's network and the host, so 1883 is never
  exposed to the public internet at all.
- TLS: EMQX supports an `ssl` listener (`config/mqtt/emqx.conf`'s base config has an `8883` block,
  commented out in the extracted default — uncomment and point `certfile`/`keyfile` at real certs
  before using this over any network you don't fully trust). Not enabled by default since the dev
  pilot runs on a trusted local/VPN network.

## Rollback

Nothing here is destructive to existing data — a pilot device is just another row in the device
registry. To back out:
- `POST /api/devices/{id}/disable` — revokes its credentials immediately.
- Unassign it from the bus (`DELETE /api/devices/{id}/assignment`) so `/mot/tracking` stops
  showing its position.
- The device's telemetry already published to Kafka ages out per the topic retention policy
  (`telemetry.kafka.retention-ms.telemetry`, default 24h) — nothing to manually clean up.
