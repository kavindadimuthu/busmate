# ADR-015 · Vehicle health is its own event type, and is visible to staff only

**Date:** 2026-09-19 · **Status:** Proposed
**Type:** architecture

## Context

The telemetry pipeline carries position and device liveness. Fleet management needs the vehicle itself
— engine, fuel, tyres, faults — and nothing carries it. Position is deliberately public: a passenger
seeing where a bus is is the product. Vehicle health is not: it can reveal that a named operator's bus
is unsafe, low on fuel or off route, and it is the operator's business data.

## Options considered

1. **Extend the location payload** with engine, fuel and tyre fields.
2. **New event types** (`vehicle-telemetry`, `alert`), each with its own versioned payload schema, read
   through a separate staff-authenticated path.
3. Keep vehicle data out of the platform and leave it on the device or in a vendor's cloud.

## Decision

**Option 2.** Option 1 puts operator-private data into the one payload the open, passenger-facing live
stream already forwards, and forces every position-only device to carry fields it cannot fill. Option 3
gives up the point of owning the pipeline. Separate event types also let each evolve on its own
`schemaVersion` without touching the envelope.

Vehicle events travel on their own topic, `iot.vehicle.v1`, so the open live-position consumer cannot
receive them by construction. Vehicle health is served only to signed-in staff, scoped to the buses their
role entitles them to, and only once database-enforced isolation exists
([ADR-016](ADR-016-runtime-database-role-cannot-bypass-row-level-security.md)); until then it is stored,
not exposed. It is upload-only: the platform does not command a bus, and a device clears its own alerts.

## Consequences

- The published contract grows by two additive payloads; no existing device or consumer changes.
- Two audiences now exist for one bus. Separate topics make keeping vehicle fields off the open path a
  structural property; the tests still assert it.
- Vehicle state ties to a bus and therefore to an operator, so tenant isolation
  ([ADR-005](ADR-005-tenant-isolation-via-database-rls.md)) must be answered for the new store.
- Downlink is still deferred; when it is needed it is a separate decision.

## Revisit when

A second consumer needs vehicle health without staff auth (for example a passenger-facing "this bus has
air conditioning" feature), or when commands from the platform to a bus become a real requirement.
