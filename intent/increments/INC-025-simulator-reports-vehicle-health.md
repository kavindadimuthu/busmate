---
id: INC-025
title: The simulated bus reports its own health and alerts through the telemetry pipeline
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A running simulated bus sends periodic vehicle-health snapshots and raises and clears alerts as its
condition changes, exactly as a real telematics unit would under the INC-023 contract — so the
platform's vehicle state and active alerts for the demo bus follow what the bus is really doing.

## Why now

INC-023 gave the platform a place to put vehicle health, and nothing yet produces any. The simulator
already models engine, fuel, tyres and warnings but holds them only in its own console. Sending them
is what makes the pipeline demonstrable end to end and gives every later fleet-health increment real
data to be built against.

## Design

- **Snapshots from the model.** Every few simulated seconds the model emits a `vehicle-telemetry`
  report mapped from its own state onto the published payload — a pure function, so what is sent is a
  testable, deterministic part of the model's output.
- **Alerts from warning transitions.** A warning that appears is a `raised` alert; one that goes away
  is `cleared`. The bus owns its alerts, so the platform only learns of a clearance when the bus says
  so. A tyre warning carries the tyre as its component.
- **Alerts are state changes, snapshots are readings.** Alerts are never dropped or merged: they queue
  in order and survive a platform outage up to a cap. Only the newest waiting snapshot is sent, as with
  position, because a stale reading is worth nothing.
- **A bus that stops must not leave alerts behind.** Switching to another bus or route while a fault
  is active first sends `cleared` for what the old bus had raised, then moves on, so the platform is
  not left holding alerts from a bus that no longer exists.
- **Same device, same rate limit.** Snapshots share the device's ingest budget with position, so they
  are paced below it rather than competing with it.

## Acceptance criteria

- [x] With the simulator running, the demo bus's latest vehicle state in the platform updates every few
      seconds and matches what the console shows.
- [x] Injecting a tyre leak raises a tyre-pressure alert for that tyre in the platform; clearing the
      fault clears it; no alert is raised twice without a clear between.
- [x] Every payload the simulator produces validates against the published `vehicle-telemetry` and
      `alert` schemas, whatever state or fault the bus is in.
- [x] Alerts arrive in the order they happened and none is lost to fast playback; only snapshots are
      thinned.
- [x] Switching bus or route with an alert raised leaves no active alert behind for the old bus.
- [x] A platform outage does not stop the bus, and queued alerts are delivered when it returns.
- [x] Tests named INC-025 cover the model's alerts, the payload mapping and the publisher's ordering.

## Out of scope

- Showing the platform's vehicle state in the console: there is no read path until INC-024, so the
  console shows what was sent and whether it was accepted, not what the platform holds.
- Alert rules or thresholds in the platform, and any portal screen.
- MQTT transport.

## Constraints

- No new third-party dependencies; the contract test reuses `ajv`, already in the lockfile.
- Sends only what the INC-023 contract declares — passenger figures are counts, and nothing
  identifies a driver or a passenger.
- Dev tool against a local stack only, as INC-022.

## Open questions

- Snapshot cadence: five simulated seconds matches position, but a real unit might report less often.
  Kept configurable in the model rather than decided here.

## Decisions

- See ADR-015 and INC-023
