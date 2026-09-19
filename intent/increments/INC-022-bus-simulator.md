---
id: INC-022
title: A simulated bus that drives a real route, reports through the telemetry pipeline, and can be controlled from a console
state: active
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A developer can start one simulated bus, watch it drive a demo route with plausible engine, fuel,
tyre and cabin state, and see the platform receive its position exactly as it would from a real
tracker — then change the bus's behaviour (speed, faults, ignition) from a browser console and see
both what the bus emitted and what the platform believes.

## Why now

The telemetry pipeline (ingest, live state, fleet health, MQTT) is built and verified, but its only
producers are a phone and a 130-line replay script that reports position alone. Nothing exercises
fleet-health rules, alerting or a vehicle-health surface, and none of those can be designed against
data that does not exist. A simulator that produces the whole bus, not just its GPS fix, is what
lets the next telemetry increments be built and demonstrated without hardware.

## Design

- **A headless simulation core, a thin server, a console.** The bus model runs in a Node process so
  buses keep driving with no browser open; the web console is only a viewer and remote control.
  Deterministic under a seed, so tests and demos repeat.
- **Publishes only what the platform already accepts.** Position goes to `POST /ingest/v1/location`
  and lifecycle to `/ingest/v1/device-status`, through the gateway, authenticated with a seeded demo
  device token — the same path `tools/device-simulator` and the conductor app use. This increment
  changes no contract.
- **Vehicle state is simulated and shown locally.** Engine, fuel, tyre, electrical and cabin state
  exist in the model and the console; putting them on the wire needed a published contract change
  (INC-023), and sending them is INC-025. The model's output shape is written so that becoming an
  event payload is a mapping, not a redesign.
- **Two views side by side.** The console shows the bus's own truth beside the platform's view of it
  (the gateway's live-bus stream), so a dropped fix, a rejected event or a stale live state is
  visible rather than silently assumed.
- **Console and simulator server are a dev tool, not a BusMate frontend.** The console talks to its
  own simulator server; only the simulator server talks to the gateway. Invariant 1 is untouched
  because nothing here is a product surface.

## Acceptance criteria

- [x] Starting the simulator with a route and a demo device token makes that bus appear in the
      gateway's live-bus stream, and its position advances along the route.
- [x] The console shows speed, engine RPM and gear, fuel level, coolant temperature, battery, and
      pressure and temperature per tyre, all updating live and all consistent with each other
      (fuel falls faster under load; RPM tracks speed and gear).
- [x] From the console, a person can pause, resume, change playback speed, set the driver profile,
      and toggle ignition; the bus visibly responds within a second.
- [x] From the console, a person can inject a fault — tyre leak, engine overheating, low fuel, GPS
      dropout — and the model's state changes as that fault would.
- [x] A GPS dropout stops position events reaching the platform and the console's platform view
      shows the bus going stale, then recovering when the dropout ends.
- [x] The same seed and inputs produce the same telemetry sequence.
- [x] With the platform unreachable the simulator keeps running, reports the failure in the
      console, and resumes sending when it returns.
- [x] Tests named INC-022 cover the model's physics relationships, fault behaviour and determinism.

## Out of scope

- **Sending vehicle telemetry (engine, fuel, tyres, alerts) to the platform.** Needs new payload
  schemas in `libs/iot-schemas` — R3, Track 2, its own increment with an ADR and a named reviewer.
- **Commands from the platform to a bus** (downlink). Deferred by the IoT plan until a concrete need
  exists; this increment's console controls the simulator, not a platform-issued command.
- **Many buses at once and scenario scripts.** One bus first; fleet mode is the next increment.
- **Video / DVR.**
- **Replacing `tools/device-simulator`.** It stays until this reaches parity, then goes in a
  separate change.
- **MQTT transport.** HTTPS only, so no new dependency is needed.

## Constraints

- New path `apps/tools/bus-simulator`. It matches no path in `policy.yaml`; classified R1 alongside
  `tools/**` in this increment, with autonomy held at A2 for the same reason as frontends (no CI
  gate would catch a regression).
- No new third-party dependencies. Built on packages already in the workspace lockfile; anything
  else is an `always_human` stop.
- Uses the seeded dev device tokens documented in `docs/dev-iot-device-credentials.md`; never
  registers real devices or touches a non-local environment.
- Personal data: none. Simulated crew and passengers are counts only.

## Open questions

- Which simulated bus should each seeded device token drive, so the live map shows a plausible
  route for the bus the token is assigned to?
- Core-service routes carry ordered stops with coordinates but no road polyline, so legs between
  stops are straight lines and a bus will cut corners. Acceptable for a demo; a road-snapped path
  would be its own increment.

## Decisions

- Routes are read from core-service through the gateway, not hard-coded, so the simulator follows
  whatever network the platform actually holds. Follow-on vehicle-telemetry contract: INC-023.
