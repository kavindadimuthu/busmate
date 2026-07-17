# Dev IoT Device Credentials

Created by telemetry-service's own Flyway demo seed
([`R__901_demo_device_credentials.sql`](../apps/backend/telemetry-service/src/main/resources/db/seed/dev/R__901_demo_device_credentials.sql)),
mirroring [`dev-seed-credentials.md`](dev-seed-credentials.md)'s pattern for user accounts. Every
token below is real — `secret_hash` in that migration is the actual SHA-256 of the plaintext shown
here (see `DeviceTokens`), not a placeholder. Once Phase 2 (HTTPS ingestion) checks
`device_credential.secret_hash`, these authenticate for real against the dev database.

Re-running the dev seed does **not** rotate these — they're `ON CONFLICT (id) DO NOTHING`, so this
list stays accurate across resets (reset the dev database if you need it regenerated).

One tracker per demo bus from [`dev-seed-contract.md`](dev-seed-contract.md#demo-iot-devices):

| Serial | Assigned bus | Bearer token |
|---|---|---|
| `GPS-DEMO-4521` | WP CAA-4521 | `bmt_devseed_01_813de247c3b1f239c4d5e955` |
| `GPS-DEMO-7734` | WP CAB-7734 | `bmt_devseed_02_f715e4f84949158e86b3dd69` |
| `GPS-DEMO-2210` | SP CAA-2210 | `bmt_devseed_03_9ecbe505e29ef2191550d253` |
| `GPS-DEMO-9981` | SP CAB-9981 | `bmt_devseed_04_deecb8b938fb498c32b66e8a` |
| `GPS-DEMO-1123` | CP NA-1123 | `bmt_devseed_05_c78c6a3227fbb34bb612300b` |
| `GPS-DEMO-1187` | CP NA-1187 | `bmt_devseed_06_94fa97c8fb986ac6551c270a` |

Use these with the Phase 2 ingest endpoint and the device simulator once they exist, e.g.:

```bash
curl -X POST localhost:9040/ingest/v1/location \
  -H "Authorization: Bearer bmt_devseed_01_813de247c3b1f239c4d5e955" \
  -H "Content-Type: application/json" \
  -d '{"lat": 6.9271, "lng": 79.8612}'
```

## Managing devices

The registry itself (register/disable/rotate/assign) is behind staff auth — `ADMIN`/`MOT` — through
the gateway's `/api/devices` and `/api/device-types` routes. Log in as one of the accounts in
[`dev-seed-credentials.md`](dev-seed-credentials.md) to manage the fleet from the management portal
or via `curl`/Swagger UI directly against `telemetry-service` (port `9040`) in dev.
