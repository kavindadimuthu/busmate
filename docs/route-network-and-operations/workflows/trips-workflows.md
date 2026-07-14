# Trip Workflows — Sequence Diagrams

Task-by-task sequence diagrams for the operations domain: trip generation, permit assignment,
operator bus/crew assignment, conductor execution, and the passenger/ticketing touchpoints.

Common participants: **GW** (api-gateway: `/api/trips`, `/api/v1/bus-operator`,
`/api/v1/conductor` all JWT-protected), **CS** (core-service; `TripController` for MOT,
`BusOperatorController` for operators, `ConductorController` for conductors — all delegating to
`TripServiceImpl`), **DB** (Postgres `trip` + fleet/licensing tables). Auth hop abbreviated
(see [stops-workflows.md](stops-workflows.md)).

## 1. Generate trips from a schedule (MOT)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/trips
    participant TC as TripController
    participant TS as TripServiceImpl
    participant DB as Postgres

    MOT->>UI: pick schedule + date range → "Generate"
    UI->>TC: POST /api/trips/generate?scheduleId&fromDate&toDate — auth
    TC->>TS: generateTripsForSchedule(scheduleId, from, to, userId)
    TS->>DB: load schedule (404 if missing)
    TS->>TS: default missing dates to schedule's effective window
    Note over TS: ⚠️ NPE if effectiveEndDate is null and no toDate given
    TS->>TS: validate range inside effective window
    TS->>DB: load schedule_stops, sort by stopOrder
    TS->>TS: departure = first stop's departureTime<br/>arrival = last stop's arrivalTime (400 if either null)
    loop each day from → to
        TS->>DB: existsByScheduleIdAndTripDate?
        alt no trip yet
            TS->>TS: build Trip (status=pending, PSP=null,<br/>bus/driver/conductor=null)
        else already exists
            TS->>TS: skip day
        end
    end
    Note over TS: ⚠️ every day gets a trip — schedule_calendar<br/>and schedule_exception are never consulted
    TS->>DB: saveAll(new trips)
    TS-->>UI: created TripResponse[]
```

## 2. Assign permits (PSP) to trips — the MOT → operator handoff

A trip becomes visible to an operator only once one of that operator's Passenger Service Permits
is attached.

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/trips/assignment
    participant TC as TripController
    participant TS as TripServiceImpl
    participant DB as Postgres

    UI->>TC: GET /api/trips?status=pending&... — unassigned trips
    UI->>TC: GET /api/permits (licensing) — candidate PSPs
    alt single trip
        MOT->>TC: PATCH /api/trips/{id}/assign-psp?pspId — auth
        TC->>TS: assignPassengerServicePermitToTrip(tripId, pspId, userId)
        TS->>DB: load trip + PSP
        TS->>TS: reject if trip already has a PSP (400)
        TS->>TS: reject if PSP not active (400)
        TS->>DB: UPDATE trip SET passenger_service_permit_id
    else bulk
        MOT->>TC: PATCH /api/trips/bulk-assign-psp (tripIds[], pspId)
        TC->>TS: loop the same validation per trip
    end
    TS-->>MOT: updated trips — now on the operator's radar
    Note over MOT: PATCH /{id}/remove-psp reverses the link
```

## 3. Operator assigns a bus to their trip

All operator endpoints verify the caller belongs to `{operatorId}` and that the trip is linked to
one of that operator's permits.

```mermaid
sequenceDiagram
    actor OP as Operator (portal /operator/trips)
    participant BOC as BusOperatorController
    participant TS as TripServiceImpl
    participant DB as Postgres

    OP->>BOC: GET /api/v1/bus-operator/{opId}/trips — auth
    BOC->>BOC: ownership: JWT user ↔ operatorId
    BOC->>DB: trips whose PSP belongs to this operator
    DB-->>OP: trip list (TripAssignmentPanel)
    OP->>BOC: GET /{opId}/buses — own fleet
    OP->>BOC: PATCH /{opId}/trips/{tripId}/assign-bus?busId
    BOC->>BOC: ownership: trip via PSP + bus belongs to operator
    BOC->>TS: assign bus
    TS->>DB: UPDATE trip SET bus_id
    TS-->>OP: 200 TripResponse
    Note over OP: PATCH .../remove-bus reverses it.<br/>⚠️ nothing prevents the same bus on two overlapping trips
```

## 4. Operator assigns a conductor (crew)

```mermaid
sequenceDiagram
    actor OP as Operator
    participant BOC as BusOperatorController
    participant DB as Postgres

    OP->>BOC: GET /{opId}/trips/{tripId} — trip detail — auth
    OP->>BOC: (crew list from own Crew pages — user-service conductors)
    OP->>BOC: PATCH /{opId}/trips/{tripId}/assign-conductor?conductorId
    BOC->>BOC: ownership checks (operator ↔ trip, conductor is operator's crew)
    BOC->>DB: UPDATE trip SET conductor_id (bare user UUID)
    DB-->>OP: 200
    Note over DB: driverId column exists but has no<br/>assignment endpoint or UI (known gap).<br/>No notification is sent to the conductor (known gap)
```

## 5. Conductor runs the trip (conductor-mobile)

Conductor endpoints are scoped to trips whose `conductorId` matches; writes re-verify ownership.

```mermaid
sequenceDiagram
    actor CON as Conductor (mobile)
    participant CC as ConductorController
    participant TS as TripServiceImpl
    participant TK as ticketing-service
    participant DB as Postgres

    CON->>CC: GET /api/v1/conductor/{conId}/trips — auth
    CC->>DB: trips WHERE conductor_id = conId
    DB-->>CON: journeys list (today's + upcoming)
    CON->>CC: GET .../trips/{tripId} — journey detail
    CON->>CC: PATCH .../trips/{tripId}/start
    CC->>CC: ownership: trip.conductorId == conId (404 otherwise)
    CC->>TS: startTrip(tripId, userId)
    TS->>TS: guard: status must be pending (409 otherwise)
    TS->>DB: status=active, actualDepartureTime=now
    loop during the journey
        CON->>TK: seat map / validate tickets / sell tickets (by tripId)
    end
    CON->>CC: PATCH .../trips/{tripId}/complete
    TS->>TS: guard: status must be active (409)
    TS->>DB: status=completed, actualArrivalTime=now
    Note over TS: PATCH .../cancel — no state guard,<br/>reason overwrites Trip.notes (known gaps)
```

## 6. MOT manual trip management (create / edit / lifecycle / delete)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/trips + [tripId]
    participant TC as TripController
    participant TS as TripServiceImpl
    participant DB as Postgres

    MOT->>TC: POST /api/trips (TripRequest) — ad-hoc trip — auth
    MOT->>TC: PUT /api/trips/{id} — edit times/bus/crew/notes
    MOT->>TC: PATCH /api/trips/{id}/start | /complete | /cancel
    Note over TC: same TripServiceImpl guards as the conductor path,<br/>but NO ownership check — MOT can act on any trip
    MOT->>TC: PATCH /api/trips/{id}/status?status=delayed
    Note over TC: ⚠️ arbitrary status jumps allowed
    MOT->>TC: DELETE /api/trips/{id}
    TC->>TS: deleteTrip(id)
    TS->>DB: DELETE trip
    alt bookings reference the trip (ticketing DB)
        Note over DB: ticketing keys bookings by tripId in its own DB —<br/>no cross-service check, orphaned bookings possible
    end
```

## 7. Monitoring: list, filters, statistics (MOT dashboard)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/trips (useTrips hook)
    participant TC as TripController
    participant DB as Postgres

    UI->>TC: GET /api/trips/statistics — stats cards — auth
    UI->>TC: GET /api/trips/filter-options — dropdown values
    UI->>TC: GET /api/trips?status=&date=&page= — paginated table
    MOT->>UI: drill by dimension
    UI->>TC: GET /api/trips/schedule/{id} · /route/{id} · /bus/{id}<br/>· /conductor/{id} · /driver/{id} · /date/{d} · /date-range
    DB-->>UI: filtered trip lists
```

## 8. Operator's daily view

```mermaid
sequenceDiagram
    actor OP as Operator
    participant BOC as BusOperatorController
    participant DB as Postgres

    OP->>BOC: GET /{opId}/dashboard/summary — auth
    DB-->>OP: counts: today's trips, unassigned, active
    OP->>BOC: GET /{opId}/trips/today
    DB-->>OP: today's departures with bus/conductor status
    Note over OP: gaps here = trips still needing<br/>a bus or conductor (workflows #3–4)
```

## 9. Passenger touchpoint: from search to a booked seat

Trips meet passengers indirectly — search returns schedule times; booking pins a seat to a
specific trip via ticketing-service.

```mermaid
sequenceDiagram
    actor PAX as Passenger (mobile)
    participant PQ as core-service /api/passenger (public)
    participant TK as ticketing-service (via gateway)
    participant PG as PaymentGateway (dummy, swappable)

    PAX->>PQ: find-my-bus (from, to, date)
    PQ-->>PAX: services + times (calendar/exception-aware)
    PAX->>PQ: find-my-bus-details — full stop timetable
    PAX->>TK: seat availability for the tripId
    TK-->>PAX: seat map (layout from Bus.seatLayout)
    PAX->>TK: create booking (tripId, seats)
    TK->>PG: initiate payment (two-step dummy flow)
    PG-->>TK: confirmed
    TK-->>PAX: ticket issued — validated on board by the conductor (workflow #5)
```

## 10. Timekeeper flow — ⚠️ mock only (intended design)

What the UI demonstrates today against in-memory data (`data/timekeeper/trips.ts`), and the API it
implies. Nothing below the dashed line exists.

```mermaid
sequenceDiagram
    actor TK as Timekeeper
    participant UI as /timekeeper/trips (mock)
    participant MOCK as data/timekeeper/trips.ts

    TK->>UI: view trips at my assigned stop
    UI->>MOCK: getTrips() — hardcoded array
    TK->>UI: "Start boarding"
    UI->>MOCK: updateTripStatus(tripId, 'boarding') — in-memory only
    TK->>UI: "Record departure"
    UI->>MOCK: updateTripStatus(tripId, 'departed')
    Note over UI,MOCK: intended real design: a timekeeper API recording<br/>per-stop actual times (trip_stop_event) and driving the<br/>unused boarding/departed/delayed statuses —<br/>see gaps-and-improvements.md
```
