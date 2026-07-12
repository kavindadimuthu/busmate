# S3 — Current State

> How trip operations are built today. Grounded in the `operations` package. Diagram annotations
> `⚠ G-S3-xx` point at known issues detailed in [gaps-and-improvements.md](gaps-and-improvements.md).

## Architecture / component structure

Two controllers front one service. `TripController` (`/api/trips`) is the MOT/admin surface;
`ConductorController` (`/api/v1/conductor`) is the ownership-scoped conductor surface. Both delegate
to `TripServiceImpl`, which owns all trip logic and reaches into fleet/licensing/scheduling repos.
A conductor/driver has **no entity** here — they are bare `UUID` columns pointing at user-service.

```mermaid
classDiagram
    class TripController {
        +createTrip()
        +getAllTrips(filters, page)
        +updateTripStatus(status) ⚠ G-S3-03
        +startTrip() ⚠ G-S3-05
        +completeTrip() ⚠ G-S3-05
        +cancelTrip(reason) ⚠ G-S3-05
        +deleteTrip() ⚠ G-S3-08
        +generateTripsForSchedule() ⚠ G-S3-01
    }
    class ConductorController {
        +getMyTrips(conductorId)
        +startMyTrip() verifyOwnership
        +completeMyTrip() verifyOwnership
        +cancelMyTrip() verifyOwnership
    }
    class TripServiceImpl {
        +generateTripsForSchedule() ⚠ G-S3-01 G-S3-02
        +assignBusToTrip() ⚠ G-S3-06
        +assignConductorToTrip() ⚠ G-S3-06
        +startTrip() pending→active
        +completeTrip() active→completed
        +cancelTrip() ⚠ G-S3-04
        +updateTripStatus() ⚠ G-S3-03
        +getStatistics() ⚠ G-S3-07
    }
    class TripRepository
    class Trip {
        +UUID id
        +LocalDate tripDate
        +LocalTime scheduledDepartureTime
        +LocalTime actualDepartureTime ⚠ G-S3-09
        +LocalTime scheduledArrivalTime
        +LocalTime actualArrivalTime ⚠ G-S3-09
        +UUID driverId ⚠ G-S3-10
        +UUID conductorId
        +TripStatusEnum status
        +String notes ⚠ G-S3-04
    }
    class TripStatusEnum {
        <<enumeration>>
        pending active completed cancelled
        delayed in_transit boarding departed ⚠ G-S3-12
    }
    class Schedule
    class PassengerServicePermit
    class Bus

    TripController --> TripServiceImpl
    ConductorController --> TripServiceImpl
    TripServiceImpl --> TripRepository
    TripRepository --> Trip
    Trip "1" --> "1" Schedule : schedule (required)
    Trip "1" --> "0..1" PassengerServicePermit : psp (optional)
    Trip "1" --> "0..1" Bus : bus (optional)
    Trip --> TripStatusEnum : status
```

## Data model

`Trip` is the only entity S3 owns; everything else it references belongs to S2 (Schedule/Route) or
S4 (Bus/PSP/Operator). `driverId`/`conductorId` are unmanaged FKs into user-service.

```mermaid
erDiagram
    SCHEDULE ||--o{ TRIP : "materialises into"
    PASSENGER_SERVICE_PERMIT ||--o{ TRIP : "authorises (optional)"
    BUS ||--o{ TRIP : "operates (optional)"
    TRIP {
        uuid id PK
        uuid schedule_id FK "required"
        uuid passenger_service_permit_id FK "nullable"
        uuid bus_id FK "nullable"
        uuid driver_id "bare col, no entity (G-S3-10)"
        uuid conductor_id "bare col → user-service"
        date trip_date
        time scheduled_departure_time
        time actual_departure_time "nullable, no date part (G-S3-09)"
        time scheduled_arrival_time
        time actual_arrival_time "nullable"
        string status "TripStatusEnum"
        string notes "reused for cancel reason (G-S3-04)"
    }
```

## Trip lifecycle / state machine (as actually driven by the code)

Only 4 of the 8 enum values are ever set by a transition; `delayed/in_transit/boarding/departed`
are dead vocabulary (`G-S3-12`). `PATCH /status` bypasses the machine entirely (`G-S3-03`).

```mermaid
stateDiagram-v2
    [*] --> pending : generate / create
    pending --> active : startTrip() sets actualDepartureTime=now
    active --> completed : completeTrip() sets actualArrivalTime=now
    pending --> cancelled : cancelTrip()
    active --> cancelled : cancelTrip()
    completed --> cancelled : cancelTrip() ⚠ NO GUARD (G-S3-03)
    note right of cancelled
        cancelTrip() overwrites Trip.notes with the reason (G-S3-04)
    end note
    note left of pending
        PATCH /status can jump to ANY value incl.
        the 4 dead statuses, with no validation (G-S3-03)
    end note
```

## API surface

`TripController` = `/api/trips`; `ConductorController` = `/api/v1/conductor`. Operator assignment
(`assignBusToTrip`/`assignConductorToTrip`) is exposed via the S4 `BusOperatorController`, not here.

| Method + path | Purpose | Auth / scope | Notes |
|---|---|---|---|
| `POST /api/trips/generate` | Materialise schedule → trips | authenticated (MOT) | ⚠ ignores calendar/exceptions (G-S3-01), NPE on open-ended (G-S3-02) |
| `GET /api/trips` | Paged/sorted/filtered list | authenticated | explicit LEFT joins; sortBy allow-listed |
| `GET /api/trips/{id}` · `/schedule/{}` · `/route/{}` · `/date/{}` · `/bus/{}` · `/conductor/{}` … | Read variants | authenticated | — |
| `PUT /api/trips/{id}` | Full update | authenticated | — |
| `PATCH /api/trips/{id}/status` | Set status | authenticated | ⚠ no state-machine guard (G-S3-03) |
| `PATCH /api/trips/{id}/start\|/complete\|/cancel` | Lifecycle | authenticated | ⚠ **no ownership/role check** (G-S3-05); cancel overwrites notes (G-S3-04) |
| `PATCH /api/trips/{id}/assign-psp` · `/remove-psp` · `/bulk-assign-psp(s)` | PSP assignment | authenticated | duplicate PSP+route+date blocked |
| `GET /api/trips/statistics` | KPI aggregates | authenticated | ⚠ on-time rate hardcoded 85% (G-S3-07) |
| `GET /api/trips/filter-options` | UI filter lookups | authenticated | — |
| `DELETE /api/trips/{id}` | Hard delete | authenticated | ⚠ no guard, can orphan tickets (G-S3-08) |
| `GET /api/v1/conductor/{cid}/trips[/{tid}]` | Conductor's own trips | ownership-checked | safe wrapper |
| `PATCH /api/v1/conductor/{cid}/trips/{tid}/start\|/complete\|/cancel` | Conductor lifecycle | ownership-checked | `verifyOwnership` before each write |
