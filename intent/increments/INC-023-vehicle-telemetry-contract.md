---
id: INC-023
title: A bus reports its own health — engine, fuel, tyres, alerts — into the telemetry pipeline
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A device can report vehicle health and raise or clear alerts through the same authenticated ingest
path as position; the platform validates the event, publishes it on its own topic, and stores the
latest state per bus tagged with the operator that owns the bus. Nothing reads that state back yet.

## Why now

The pipeline carries position and device liveness and nothing about the vehicle itself, so fleet
health, maintenance and alerting have no data to be built on. INC-022's simulator already models that
state and holds it locally; this is what lets it, and later a real telematics unit, put it on the wire.

## Design

Direction in [ADR-015](../decisions/ADR-015-vehicle-health-is-its-own-staff-scoped-event.md).

- **Two new event types, not a fatter location payload.** `vehicle-telemetry` (periodic snapshot:
  engine, fuel, tyres, battery, odometer, ignition, doors, passenger count) and `alert` (a raised or
  cleared condition with a code and severity), each a `.v1` payload schema. The envelope already lists
  `alert`; `vehicle-telemetry` is added to its event-type enum. Widening an enum breaks no existing
  producer and no consumer reads the new topic yet, so `envelopeVersion` stays 1. A device that only
  sends location keeps working untouched.
- **Their own topic, `iot.vehicle.v1`.** Vehicle events never share a topic with position, so the
  gateway's open live-position consumer cannot receive them by construction rather than by remembering
  to filter.
- **Ingest accepts them on both transports.** `POST /ingest/v1/vehicle-telemetry` and `/alert`, and the
  matching MQTT event types, through the existing validation, enrichment and dead-letter path.
- **The device owns its alerts.** An alert event is `raised` or `cleared`; the platform does not derive
  clearance from later snapshots, so real hardware and the simulator behave identically.
- **Latest state stored per bus, tagged with its operator.** A new Flyway migration adds a table
  telemetry-service owns, carrying `operator_id` on every row from the first migration (ADR-005: the
  column that is expensive to retrofit). The operator is resolved at ingest from core-service, best
  effort; a miss leaves the row untagged rather than dropping the event.
- **No read path in this increment.** Reading vehicle state back to staff needs the database-level
  isolation that does not exist yet — see INC-024. Until then the data is stored, not exposed.
- **Upload-only.** No command from platform to bus.

## Acceptance criteria

- [x] Valid `vehicle-telemetry` and `alert` events are accepted over HTTPS and MQTT and published to
      `iot.vehicle.v1`. Structurally invalid ones are refused (400 over HTTPS, a counted parse error
      over MQTT), as location events are; well-formed but implausible ones (a coolant temperature of
      900 °C) go to the dead-letter topic with a reason and never touch stored state.
- [x] Existing location and device-status devices behave exactly as before, and no vehicle event ever
      appears on `iot.telemetry.v1` or the gateway's live stream.
- [x] The latest vehicle state per bus is stored, with the bus's operator, and an alert clears only
      when the device says so.
- [x] An event for a bus whose operator cannot be resolved is still accepted and stored, untagged.
- [x] The published schemas, valid and invalid examples and their validation tests are updated.
- [x] Tests named INC-023 cover the above against real Postgres and a real broker.

## Out of scope

- **Any read of vehicle state** — endpoint, stream or UI. INC-024 builds the isolation that must exist
  first, and the read on top of it.
- Alert *rules* (thresholds, routing, acknowledgement) and any portal screen.
- Commands from the platform to a bus.
- History and time-series retention beyond the latest state.
- Driver-level data of any kind (invariant 8): no driver identity or behaviour scoring.
- Generated API clients: the ingest endpoints are device-facing and no client library covers
  telemetry-service, so there is nothing to regenerate.

## Constraints

- **`always_human` stops apply.** This changes a published contract and adds a migration; the named
  reviewer reads both before merge, and the migration is never run against a shared environment by an
  agent.
- Additive only: no change to an existing schema, field or topic name.
- Simulated and real devices must be indistinguishable to the platform.

## Open questions

- Sample rate the ingest rate limiter should assume for a snapshot-every-few-seconds device.

## Decisions

- See ADR-015
