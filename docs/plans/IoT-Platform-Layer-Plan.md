# IoT Platform Layer — Analysis & Implementation Plan

**Status:** Ready to implement (reverified against codebase 2026-07-17)
**Original draft:** committed `4cff9d07`
**Scope:** Add a device-ingestion layer (telemetry) to the BusMate platform, feeding real-time data (initially GPS) into existing services.

---

## 0. Readiness Assessment (verified against current codebase, 2026-07-17)

**Verdict: yes — you are in a good position to start. Begin with Phase 0.** Nothing blocks it, and one dependency (the database-migration foundation) that the plan leans on is now fully in place. The core architecture below survived reverification unchanged; the edits are refinements, not a redesign.

### What changed since the plan was drafted, and why it helps

| Area | State now | Impact on this plan |
|---|---|---|
| **DB migration & seed foundation** | The full Database-Migrations-and-Seed-Data-Plan is **complete** (Phases 0–5): every service has `db/migration` + `db/reference` + `db/seed/dev`, integration tests run on **Testcontainers Postgres with a CI gate**, and stale `schema.sql`/`data.sql` are gone. | This is the biggest de-risk. `telemetry-service` now has a **proven, repeatable template** to copy for standing up a new Flyway-managed Spring service with reference data, dev seed, and CI-gated integration tests. Phase 0/1 scaffolding is now mechanical. |
| **Mobile GPS capability** | Both `conductor-mobile` and `passenger-mobile` (Expo/React Native) **already depend on `expo-location`** (`~19.0.7`) — but it is not yet wired to any position streaming. | Phase 2's "conductor app is the first device" is lighter than estimated: the dependency and permission plumbing exist; you wire `watchPositionAsync` → POST, not add a GPS stack. |
| **Prior location-tracking code** | A generated `location-tracking-service` **API client** and a management-portal `location-tracking/page.tsx` **both existed and have been removed as dead code** (`202b8850`, and the page is gone on this branch). | Confirms greenfield — no half-built pipeline to reconcile — but note the **product intent already existed**. There was a MoT "location-tracking" screen; Phase 3's live map revives that surface with real data. |
| **RBAC** | user-service RBAC is now **Flyway reference data** (`fbe5ce57`). | Phase 1's new device-management permissions slot straight into that reference-data mechanism. |
| **Cross-service seed contract** | `docs/dev-seed-contract.md` is a **fixed-UUID registry** for demo entities crossing service boundaries (operator, route, stop, bus, trip…). | telemetry-service's `device → bus` assignment seed **must** reference the registry's demo **bus** UUIDs, and you should allocate a new **"Demo device"** UUID prefix there. See §4 note. |

### What did **not** change (plan assumptions still hold)

- **No message broker in any compose file** (`docker-compose*.yml`) — confirmed. user-service's Kafka producer still points at a `localhost:9092` that doesn't exist in dev. Phase 0's Redpanda container both unblocks that producer and serves the IoT pipeline.
- **`telemetry-service` does not exist** and `libs/` holds only `api-clients` + `ui` — no `iot-schemas` yet. Greenfield as planned.
- **`api-gateway` is Node/Express** with **no SSE/WebSocket** today — it is a pure auth/proxy/BFF. This sharpens where Phase 3 streaming lives (see refined Phase 3): SSE belongs in the Express gateway, not the Spring services.

### First concrete step

Phase 0, task 1: add a Redpanda service to `docker-compose.yml`. It is the smallest, highest-leverage move — it unblocks the already-shipped user-service producer *and* lays the pipeline substrate, with zero coupling to the rest of the plan if you pause after it.

---

## 1. Review of the Original Proposal

### What the proposal gets right (keep these)

| Idea | Verdict |
|---|---|
| Protocol adapters at the edge, normalized events inside | ✅ Correct and industry-standard (this is exactly how AWS IoT Core, Eclipse Hono, ThingsBoard work). Keep as the core design principle. |
| Central message broker between ingestion and consumers | ✅ Correct, and cheap for us: user-service already produces to Kafka (`operator-events`, user events), so Kafka is the natural pick — not RabbitMQ. |
| Backend services never know the device protocol | ✅ Keep. Consumers only ever see the common event envelope. |
| Common internal event format | ✅ Keep, but the sketched format is incomplete — see §3 (needs versioning, ingest metadata, typed payload schemas). |

### What the proposal misses (these will hurt if skipped)

1. **Device identity, provisioning, and auth.** The diagram has no answer to "who is allowed to publish, and as which bus?" A device registry + per-device credentials is the actual foundation of an IoT platform; without it anyone on the internet can inject fake bus positions. This must be **Phase 1**, before any ingestion.
2. **Device ↔ bus ↔ trip mapping.** `deviceId: "BUS-101"` in the example conflates device and bus. A GPS unit is installed in a bus, gets moved between buses, and a bus runs different trips per day. The registry must map `device → bus`, and enrichment must resolve `bus → active trip` at ingest/consume time.
3. **Two timestamps, not one.** Devices have wrong clocks and buffer messages offline (cellular dead zones on rural routes are a reality in Sri Lanka). Every event needs `deviceTimestamp` **and** `ingestedAt`, and consumers must tolerate late/out-of-order data.
4. **Duplicates and ordering.** MQTT QoS 1 re-delivers; Kafka consumers reprocess on rebalance. Events need a dedup key (`deviceId + sequenceNo` or `deviceId + deviceTimestamp`) and consumers must be idempotent.
5. **Schema versioning.** `eventType` alone isn't enough — payloads will evolve. Envelope carries `schemaVersion`; topics carry a version suffix (`iot.telemetry.v1`).
6. **Downlink (server → device).** The proposal is upload-only. Even v1 GPS trackers need config pushes (reporting interval) eventually. Don't build it now, but pick a broker that supports it (MQTT does natively; a bare TCP gateway makes it painful).
7. **Fleet health monitoring.** "Device went silent" is itself a critical event. The platform must track last-seen per device and alert.

### What the proposal over-weights (defer or drop)

- **Custom TCP gateway in v1.** You have **zero devices today**. Building a Netty TCP gateway for hypothetical proprietary protocols is speculative work. The architecture should *allow* it (that's free — it's just another producer to the same Kafka topic), but build it only when a concrete device demands it.
- **CoAP, LoRaWAN, OPC-UA.** OPC-UA is industrial-automation and irrelevant to buses. LoRaWAN is wrong for moving vehicles with per-second GPS. Mentioning them as "future adapters" is fine; planning for them is noise.
- **"HTTP (optional)".** Backwards — HTTPS ingestion should be **first**, not optional. The cheapest possible "device" is the conductor's existing mobile app posting GPS. That gets real telemetry flowing end-to-end with **zero hardware purchases**, and it exercises the exact same pipeline real trackers will use.
- **Analytics box in the diagram.** A Kafka consumer group away whenever you want it. Nothing to build now.

---

## 2. Target Architecture

New deployable: **`telemetry-service`** (Spring Boot, same stack as the other backend services) — owns the device registry, all ingestion adapters, normalization, and the live-state store. Protocol-specific logic stays inside it; everything downstream consumes Kafka.

```mermaid
flowchart TB
    subgraph devices["Devices / Sources"]
        APP["Conductor mobile app<br/>(HTTPS, Phase 2 — first 'device')"]
        GPS["GPS trackers<br/>(MQTT, Phase 4)"]
        TCPDEV["Proprietary trackers<br/>(TCP, only if ever needed)"]
    end

    subgraph telemetry["telemetry-service (new)"]
        HTTPIN["HTTPS ingest endpoint"]
        MQTTIN["MQTT adapter<br/>(subscribes to broker)"]
        TCPGW["TCP gateway<br/>(deferred)"]
        REG["Device registry<br/>+ credentials + bus assignment"]
        NORM["Validate · authenticate ·<br/>enrich · normalize"]
        LIVE["Live-state store<br/>(latest position per bus)"]
    end

    BROKER["MQTT broker (EMQX)<br/>Phase 4"]

    KAFKA[("Kafka<br/>iot.telemetry.v1<br/>iot.device-status.v1")]

    subgraph consumers["Consumers (existing services)"]
        CORE["core-service<br/>passengerinfo: real ETAs for FindMyBus<br/>operations: trip progress"]
        WS["api-gateway<br/>SSE/WebSocket → live map"]
        MON["Fleet health monitor<br/>(inside telemetry-service)"]
    end

    subgraph frontends["Frontends"]
        PW["passenger-web"]
        MP["management-portal"]
    end

    APP --> HTTPIN
    GPS --> BROKER --> MQTTIN
    TCPDEV -.-> TCPGW
    HTTPIN --> NORM
    MQTTIN --> NORM
    TCPGW -.-> NORM
    REG --- NORM
    NORM --> KAFKA
    NORM --> LIVE
    KAFKA --> CORE
    KAFKA --> WS
    KAFKA --> MON
    WS --> PW
    WS --> MP
```

Design principle retained from the proposal: **protocol-specific logic stays at the edge (inside telemetry-service adapters); everything inside the platform communicates via versioned events on Kafka.**

### Why these choices

- **Kafka, not RabbitMQ** — user-service already ships a Kafka producer and config; adding RabbitMQ would mean two brokers. For local dev, run **Redpanda** in docker-compose (single container, Kafka-API-compatible, no ZooKeeper/JVM) — this also finally gives the existing user-service producer a broker to talk to in dev.
- **EMQX as the MQTT broker** (when hardware arrives) — has HTTP-hook device authentication we can point at telemetry-service's registry, plus built-in Prometheus metrics that slot into your existing observability stack. Mosquitto is fine too if you prefer minimal; the adapter code doesn't change.
- **One new service, not many** — a separate "gateway" per protocol as separate deployables is premature at this scale. Adapters are packages inside telemetry-service; split them out later only if load demands it.
- **Live-state store** — consumers asking "where is bus X *now*" shouldn't replay Kafka. telemetry-service keeps latest-position-per-bus (Postgres table is fine at your scale; Redis later if needed) and exposes it via REST, same pattern as your other services.

---

## 3. Common Event Envelope (v1)

```json
{
  "envelopeVersion": 1,
  "eventId": "uuid — generated at ingest, dedup key downstream",
  "eventType": "location | device-status | alert | ...",
  "schemaVersion": 1,
  "deviceId": "uuid from device registry (NOT the bus id)",
  "busId": "uuid — resolved from registry at ingest; null if unassigned",
  "tripId": "uuid — resolved if a trip is active; else null",
  "deviceTimestamp": "2026-07-17T08:31:02Z",
  "ingestedAt": "2026-07-17T08:31:05Z",
  "sequenceNo": 4812,
  "source": { "adapter": "https|mqtt|tcp", "gateway": "telemetry-service-1" },
  "payload": { }
}
```

Rules:
- `payload` schema is defined **per `eventType` + `schemaVersion`** as JSON Schema files in `libs/` (shared, versioned in git — a lightweight schema registry). Ingest validates against them; invalid messages go to `iot.telemetry.dlq.v1` with the rejection reason, never silently dropped.
- Kafka key = `deviceId` → per-device ordering within a partition.
- `location` payload v1: `lat`, `lng`, `speedKmh?`, `headingDeg?`, `accuracyM?`.

```mermaid
sequenceDiagram
    autonumber
    participant D as Device / conductor app
    participant T as telemetry-service
    participant K as Kafka
    participant C as core-service (consumer)
    participant G as api-gateway (SSE)
    participant P as passenger-web map

    D->>T: POST /ingest/v1/location (device token)
    T->>T: authenticate token → deviceId
    T->>T: validate payload (JSON Schema)
    T->>T: enrich: device → busId, busId → active tripId
    T->>T: upsert live-state (latest position for bus)
    T->>K: publish iot.telemetry.v1 (key = deviceId)
    T-->>D: 202 Accepted
    K->>C: consume → update trip progress / ETA inputs
    K->>G: consume → push over SSE
    G->>P: bus position update on live map
```

---

## 4. Device Registry (Phase 1 data model)

Lives in telemetry-service's own database (`busmate_telemetry`), Flyway-managed like the other services.

```mermaid
erDiagram
    DEVICE {
        uuid id PK
        string serial_number UK
        string device_type "GPS_TRACKER | CONDUCTOR_APP | ..."
        string status "PROVISIONED | ACTIVE | DISABLED | RETIRED"
        timestamptz last_seen_at
        timestamptz created_at
    }
    DEVICE_CREDENTIAL {
        uuid id PK
        uuid device_id FK
        string credential_type "TOKEN_HASH | MQTT_PASSWORD_HASH | CERT_FINGERPRINT"
        string secret_hash
        timestamptz expires_at
        timestamptz revoked_at
    }
    DEVICE_ASSIGNMENT {
        uuid id PK
        uuid device_id FK
        uuid bus_id "references core-service bus (by id, no FK across DBs)"
        timestamptz assigned_at
        timestamptz unassigned_at "null = current"
    }
    BUS_LIVE_STATE {
        uuid bus_id PK
        uuid device_id
        uuid trip_id
        double lat
        double lng
        double speed_kmh
        timestamptz device_timestamp
        timestamptz ingested_at
    }
    DEVICE ||--o{ DEVICE_CREDENTIAL : has
    DEVICE ||--o{ DEVICE_ASSIGNMENT : "installed in"
```

Assignment history (not just current) matters: it's how you answer "which device produced this bus's track last Tuesday" and how you handle trackers moved between buses. `bus_id` is a soft reference across service databases — same convention you already use between services.

> **Seed-contract note:** `device_assignment.bus_id` must reference the **fixed demo bus UUIDs** in `docs/dev-seed-contract.md` (prefix `00000000-0000-0000-0000-0000000103xx`), not freshly invented ones — otherwise the dev seed won't line up with core-service's buses. Allocate a new **"Demo device"** UUID prefix in that registry (e.g. `…0000000105xx`) when you write telemetry-service's `db/seed/dev` migration.

---

## 5. Implementation Phases

```mermaid
flowchart LR
    P0["Phase 0<br/>Foundations<br/>(broker + schemas + service skeleton)"]
    P1["Phase 1<br/>Device registry<br/>+ admin UI"]
    P2["Phase 2<br/>HTTPS ingestion<br/>+ conductor-app GPS"]
    P3["Phase 3<br/>Consumers: live map<br/>+ real FindMyBus ETAs"]
    P4["Phase 4<br/>MQTT + hardware<br/>trackers + hardening"]
    P5["Phase 5 (deferred)<br/>TCP gateway · downlink<br/>· analytics"]
    P0 --> P1 --> P2 --> P3 --> P4 -.-> P5
```

**Value milestone: end of Phase 3 = live buses on the passenger map and schedule-independent ETAs, with no hardware purchased.**

### Phase 0 — Foundations
- Add **Redpanda** to `docker-compose.yml` (dev) — this also unblocks user-service's existing producer locally (which currently has no broker to reach). Add to `docker-compose.production.yml` topology as well, or point at managed Kafka there.
- Scaffold `apps/backend/telemetry-service` (Spring Boot, Java 17) by **copying the now-established service template**: `db/migration` + `db/reference` + `db/seed/dev` Flyway layout, OTel wiring, `project.json` for Nx, a `Dockerfile` expecting a pre-built jar, entries in both compose files, and **Testcontainers integration tests wired into the existing CI gate** (Database-Migrations plan Phases 4–5). Own database `busmate_telemetry` in `scripts/postgres/init-dev-dbs.sql`.
- Define envelope + `location`/`device-status` v1 JSON Schemas in `libs/iot-schemas/` with a validation test suite.
- Topics: `iot.telemetry.v1`, `iot.device-status.v1`, `iot.telemetry.dlq.v1`.

### Phase 1 — Device registry & provisioning
- Flyway migrations for the §4 tables; CRUD APIs (register device → returns one-time token; assign/unassign to bus; disable/revoke).
- Admin screens in management-portal (device list, register, assign to bus) behind existing RBAC (new permission(s) in user-service's RBAC reference data).
- Route through api-gateway like the other services.

### Phase 2 — HTTPS ingestion (first real telemetry)
- `POST /ingest/v1/{eventType}` with per-device bearer token auth (hashed at rest), rate-limited per device. Route through api-gateway (which already owns bearer-token auth for conductor-mobile).
- Validate → enrich (busId, active tripId via core-service data) → publish to Kafka → upsert `bus_live_state`. Reject to DLQ with reason.
- **Conductor app posts GPS while a trip is active** — the first production "device". `expo-location` is **already a dependency** in `conductor-mobile`; the work is wiring `watchPositionAsync` (coarse interval, only while a trip is active) to the ingest endpoint, plus the foreground-location permission prompt — not adding a GPS stack. The conductor's active-trip context already exists in the journey screens.
- Build a **device simulator** script (replays a route's stop coordinates at bus speed) in `tools/` — this is your load-test and demo rig, worth the investment. Seed it from the demo route/stop UUIDs in `docs/dev-seed-contract.md` so it lines up with existing dev data.

### Phase 3 — First consumers (the payoff)
- api-gateway (Node/Express) consumes `iot.telemetry.v1` with a Kafka client and pushes **SSE** streams (`/live/buses?routeId=…`) to passenger-web and management-portal. SSE lives here — Express supports `text/event-stream` natively, the gateway is already the single browser-facing entry point, and it keeps long-lived connections out of the Spring services. The management-portal **location-tracking screen that previously existed** (removed as dead code) is the natural home for the operator/MoT live map — rebuild it against this stream.
- core-service passengerinfo: use live position to produce **real ETAs** in FindMyBus — this is where the existing `TimeSourceEnum` (`VERIFIED/CALCULATED/…`) finally gets a live-data source. Fall back to schedule-based estimates when no telemetry (which stays the common case for a long time).
- Fleet health: scheduled job flags devices silent > N minutes → `device-status` event → management-portal indicator.

### Phase 4 — MQTT + hardware trackers + hardening
- EMQX broker; device auth via HTTP-hook against the registry; MQTT adapter in telemetry-service subscribing `devices/{deviceId}/telemetry`.
- Idempotent consumers (dedup on `deviceId+sequenceNo`), late-data policy (drop stale live-state updates older than current), retention/downsampling policy for the telemetry topic.
- Grafana dashboard (existing observability stack): ingest rate, DLQ rate, device fleet online/offline, end-to-end latency.
- Pilot with 1–2 real GPS units on one route before fleet rollout.

### Phase 5 — Deferred until a concrete need exists
- Custom TCP gateway (Netty) — only when a specific proprietary device is procured.
- Downlink/commands over MQTT (config updates to trackers).
- Analytics consumers (historical tracks, driver behavior, headway analysis) — new consumer groups, no pipeline changes.

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| Fake/incorrect positions (spoofing, GPS drift) | Per-device credentials from day one; plausibility checks at ingest (speed/jump limits); accuracy field honored. |
| Cellular dead zones → bursts of late data | Two timestamps; live-state ignores out-of-date updates; consumers idempotent. |
| Kafka now on the critical dev path | Redpanda is one lightweight container; telemetry-service degrades gracefully (ingest still updates live-state if publish fails, with retry/outbox — same outbox pattern user-service already uses). |
| Conductor-app GPS drains phone battery / is forgotten | Coarse interval (10–15 s), only while trip active; treat as stopgap until hardware trackers. |
| Scope creep toward "full IoT platform" | Phases gated on real devices; Phase 5 explicitly deferred. |
