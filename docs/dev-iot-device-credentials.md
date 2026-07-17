# Dev IoT Device Credentials

Created by telemetry-service's own Flyway demo seed
([`R__901_demo_device_credentials.sql`](../apps/backend/telemetry-service/src/main/resources/db/seed/dev/R__901_demo_device_credentials.sql)),
mirroring [`dev-seed-credentials.md`](dev-seed-credentials.md)'s pattern for user accounts. Every
token below is real — `secret_hash` in that migration is the actual SHA-256 of the plaintext shown
here (see `DeviceTokens`), not a placeholder. `POST /ingest/v1/location` (Phase 2) checks
`device_credential.secret_hash`, so these authenticate for real against the dev database.

Re-running the dev seed does **not** rotate these — they're `ON CONFLICT (id) DO NOTHING`, so this
list stays accurate across resets (reset the dev database if you need it regenerated).

One tracker per demo bus, plus one for the conductor app, from
[`dev-seed-contract.md`](dev-seed-contract.md#demo-iot-devices):

| Serial | Assigned bus | Bearer token |
|---|---|---|
| `GPS-DEMO-4521` | WP CAA-4521 | `bmt_devseed_01_813de247c3b1f239c4d5e955` |
| `GPS-DEMO-7734` | WP CAB-7734 | `bmt_devseed_02_f715e4f84949158e86b3dd69` |
| `GPS-DEMO-2210` | SP CAA-2210 | `bmt_devseed_03_9ecbe505e29ef2191550d253` |
| `GPS-DEMO-9981` | SP CAB-9981 | `bmt_devseed_04_deecb8b938fb498c32b66e8a` |
| `GPS-DEMO-1123` | CP NA-1123 | `bmt_devseed_05_c78c6a3227fbb34bb612300b` |
| `GPS-DEMO-1187` | CP NA-1187 | `bmt_devseed_06_94fa97c8fb986ac6551c270a` |
| `CONDUCTOR-APP-DEMO-001` | none (resolves bus per-request from its `tripId`) | `bmt_devseed_07_e04d83705b012955cb56e8f5` |
| `MQTT-CONSUMER-INTERNAL` | none — not a fleet device | `bmt_UUdpLfnE2mf18jyV8Shc4RklxGmsmcrwg8gUxssk7bU` |

The first six are `GPS_TRACKER`s with a static bus assignment. `CONDUCTOR-APP-DEMO-001` is a
`CONDUCTOR_APP` device with **no** assignment — it reports whichever bus it's currently on by
sending a `tripId` hint with every fix (see `IngestService.resolveBusAndTrip`).

**Phase 4 update:** conductor-mobile no longer uses this shared demo token by default — each
install now self-provisions its own `CONDUCTOR_APP` device on first use via
`POST /api/devices/provision-conductor` (see `src/services/telemetry/deviceProvisioning.ts` in that
app), closing the "every conductor reports as the same device" simplification from Phase 2. This
row stays useful for manual `curl` testing and as a fallback demo credential; it just isn't what a
real conductor-mobile session uses anymore.

`MQTT-CONSUMER-INTERNAL` is a `MQTT_CONSUMER`-type device (Phase 4) — telemetry-service's own MQTT
subscriber authenticates to EMQX with this token, through the exact same device-credential webhook
as any real tracker (see `config/mqtt/emqx.conf`, `MqttAuthController`). Not something a real
device ever presents; it's what `TELEMETRY_MQTT_USERNAME`/`TELEMETRY_MQTT_PASSWORD` default to in
dev.

## Try it

**HTTPS:**
```bash
curl -X POST localhost:9040/ingest/v1/location \
  -H "Authorization: Bearer bmt_devseed_01_813de247c3b1f239c4d5e955" \
  -H "Content-Type: application/json" \
  -d '{"deviceTimestamp": "2026-07-17T08:31:02Z", "payload": {"lat": 6.9271, "lng": 79.8612, "speedKmh": 42}}'
```

**MQTT** (Phase 4 — publish to `devices/{deviceId}/telemetry/location`, using the device's `id`
from `/api/devices`, not its serial number; password = the device's `bmt_` token, username can be
anything):
```bash
docker run --rm --network busmate_default eclipse-mosquitto mosquitto_pub \
  -h emqx -p 1883 -u anything -P bmt_devseed_01_813de247c3b1f239c4d5e955 \
  -t "devices/00000000-0000-0000-0000-000000010601/telemetry/location" \
  -m '{"deviceTimestamp": "2026-07-17T08:31:02Z", "payload": {"lat": 6.9271, "lng": 79.8612, "speedKmh": 42}}'
```

Or run the [device simulator](../tools/device-simulator/README.md) for a whole moving-bus demo
over HTTPS:

```bash
pnpm simulate:device
```

## Managing devices

The registry itself (register/disable/rotate/assign) is behind staff auth — `ADMIN`/`MOT` — through
the gateway's `/api/devices` and `/api/device-types` routes. Log in as one of the accounts in
[`dev-seed-credentials.md`](dev-seed-credentials.md) to manage the fleet from the management portal
or via `curl`/Swagger UI directly against `telemetry-service` (port `9040`) in dev.
