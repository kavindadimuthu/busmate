# @busmate/iot-schemas

Versioned JSON Schemas for the BusMate IoT event contract — the shape every normalized device event
carries on the internal `iot.*.v1` Kafka topics. This is the lightweight, git-versioned schema
registry referenced by [`docs/plans/IoT-Platform-Layer-Plan.md`](../../docs/plans/IoT-Platform-Layer-Plan.md) §3.

**Design principle:** protocol-specific logic stays at the edge (telemetry-service adapters);
everything inside the platform speaks these versioned events.

## Layout

```
schemas/
  envelope.v1.json         # common envelope (all events)
  location.v1.json         # payload for eventType=location, schemaVersion=1
  device-status.v1.json    # payload for eventType=device-status, schemaVersion=1
examples/valid/            # canonical accepted messages (fixtures + docs)
examples/invalid/          # messages that MUST be rejected
test/validate.test.mjs     # ajv validation suite
index.mjs                  # programmatic access for JS/TS consumers + TOPICS constant
```

## Versioning rules

- The **envelope** shape is versioned by `envelopeVersion` (and the `envelope.vN.json` filename).
  Bump only on a breaking change to the envelope itself.
- Each **payload** is versioned per `eventType` by `schemaVersion` (and the `<eventType>.vN.json`
  filename). An envelope's `eventType` + `schemaVersion` select which payload schema applies.
- Topics carry a version suffix (`iot.telemetry.v1`). A breaking payload change ships a new schema
  version and, when it can't be tolerated in place, a new topic version.

At ingest, telemetry-service validates the envelope and the selected payload schema; anything that
fails is routed to `iot.telemetry.dlq.v1` with the rejection reason — never silently dropped.

## Run the tests

```bash
pnpm --filter @busmate/iot-schemas test    # or: nx test iot-schemas
```

Schemas are authored in JSON Schema draft-07 for broad tooling compatibility (ajv, Spring, editors).
