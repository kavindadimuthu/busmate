# S3 — Workflows

> One sequence diagram per current trip workflow. Steps flagged `⚠ G-S3-xx` are where the flow is
> buggy/unguarded (see [gaps-and-improvements.md](gaps-and-improvements.md)). Fuller per-task
> diagrams also exist in
> [route-network-and-operations/workflows/trips-workflows.md](../../../route-network-and-operations/workflows/trips-workflows.md).

## W1 · Generate trips for a schedule (MOT) — realizes C-S3-01

```mermaid
sequenceDiagram
    actor M as MOT user
    participant C as TripController
    participant S as TripServiceImpl
    participant SR as ScheduleRepository
    participant TR as TripRepository
    M->>C: POST /api/trips/generate?scheduleId&fromDate?&toDate?
    C->>S: generateTripsForSchedule(...)
    S->>SR: findById(scheduleId)
    SR-->>S: Schedule (+ ScheduleStops)
    Note over S: effectiveTo = toDate ?? schedule.effectiveEndDate<br/>⚠ NPE if both null (G-S3-02)
    S->>S: derive dep/arr from first/last stop
    loop each date from → to
        S->>TR: existsByScheduleIdAndTripDate?
        Note over S: ⚠ never checks ScheduleCalendar<br/>or ScheduleException (G-S3-01)
        S->>S: build Trip(status=pending)
    end
    S->>TR: saveAll(trips)
    S-->>C: List<TripResponse>
    C-->>M: 201 Created
```

## W2 · Operator assigns PSP + bus + conductor — realizes C-S3-03

```mermaid
sequenceDiagram
    actor O as Operator
    participant BC as BusOperatorController (S4)
    participant S as TripServiceImpl
    participant TR as TripRepository
    O->>BC: PATCH .../assign-psp / assign-bus / assign-conductor
    BC->>BC: derive operatorId from JWT, ownership-check trip
    BC->>S: assignPassengerServicePermitToTrip / assignBusToTrip / assignConductorToTrip
    S->>TR: findById(tripId)
    alt PSP
        S->>S: check PSP active + not duplicate (PSP+route+date)
    else Bus
        S->>S: check bus active + operator matches PSP operator
    else Conductor
        S->>S: check trip has no conductor yet
    end
    Note over S: ⚠ no check that bus/conductor is free of<br/>OTHER time-overlapping trips (G-S3-06)
    S->>TR: save(trip)
    S-->>BC: TripResponse
    BC-->>O: 200 OK
```

## W3 · Conductor executes their trip (self-service) — realizes C-S3-05

```mermaid
sequenceDiagram
    actor Cd as Conductor (mobile)
    participant CC as ConductorController
    participant S as TripServiceImpl
    participant TR as TripRepository
    Cd->>CC: PATCH /api/v1/conductor/{cid}/trips/{tid}/start
    CC->>S: getTripById(tid)
    S-->>CC: trip
    CC->>CC: verifyOwnership(cid == trip.conductorId) else 404
    CC->>S: startTrip(tid)
    S->>TR: findById → guard status==pending
    S->>S: status=active, actualDepartureTime=now()
    S->>TR: save
    S-->>CC: TripResponse
    CC-->>Cd: 200 OK
    Note over Cd,CC: complete/cancel follow the same verifyOwnership pattern
```

## W4 · Generic lifecycle endpoints (the unguarded path) — affects C-S3-04, C-S3-05

```mermaid
sequenceDiagram
    actor A as Any authenticated user
    participant C as TripController
    participant S as TripServiceImpl
    participant TR as TripRepository
    A->>C: PATCH /api/trips/{id}/cancel?reason=...
    Note over C: ⚠ no ownership/role check at all (G-S3-05)
    C->>S: cancelTrip(id, reason)
    S->>TR: findById
    Note over S: ⚠ no status guard — a completed trip<br/>can be cancelled (G-S3-03)
    S->>S: status=cancelled; notes=reason ⚠ overwrites existing notes (G-S3-04)
    S->>TR: save
    S-->>C: TripResponse
    C-->>A: 200 OK
```
