# Schedule Workflows — Sequence Diagrams

Task-by-task sequence diagrams for schedules, calendars and exceptions.

Common participants: **MOT** (management-portal `app/mot/schedules/`), **GW** (api-gateway,
`/api/schedules` JWT-protected), **CS** (core-service `ScheduleController →
ScheduleServiceImpl`), **DB** (Postgres `schedule`, `schedule_stop`, `schedule_calendar`,
`schedule_exception`). Auth hop abbreviated (see [stops-workflows.md](stops-workflows.md)).

## 1. Create a schedule with stop times (`/full`)

The workspace flow — header plus every per-stop time in one request.

```mermaid
sequenceDiagram
    actor MOT
    participant WS as Schedule Workspace<br/>(form / textual / AI mode)
    participant CS as ScheduleController
    participant SVC as ScheduleServiceImpl
    participant DB as Postgres

    MOT->>WS: pick route
    WS->>CS: GET /api/routes/{id} — load ordered route stops
    MOT->>WS: name, type (REGULAR/SPECIAL),<br/>effective start (+optional end) date
    MOT->>WS: arrival/departure time per route stop
    WS->>CS: POST /api/schedules/full (ScheduleRequest + stops[]) — auth
    CS->>SVC: createFullSchedule(request, userId)
    SVC->>DB: INSERT schedule (status = PENDING)
    SVC->>DB: INSERT schedule_stop × n (route_stop_id, times, stopOrder)
    SVC-->>WS: 201 ScheduleResponse
    WS-->>MOT: schedule visible at /mot/schedules/[scheduleId]
    Note over WS: plain POST /api/schedules creates the header only;<br/>POST /api/schedules/bulk creates many headers at once
```

The workspace's AI Studio and textual modes work exactly like the route workspace's
(see [routes-workflows.md](routes-workflows.md) #3–4): they hydrate the same draft state, and
submission always goes through this API call.

## 2. Set the operating calendar (days of week)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/schedules/[scheduleId]
    participant CS as ScheduleController
    participant SVC as ScheduleServiceImpl
    participant DB as Postgres

    MOT->>UI: tick Mon–Sat, untick Sun
    UI->>CS: PUT /api/schedules/{id}/calendar (ScheduleCalendarRequest) — auth
    CS->>SVC: updateCalendar(id, request, userId)
    SVC->>DB: replace schedule_calendar row (7 boolean flags)
    SVC-->>UI: 200
    Note over DB: consumed by passenger find-my-bus…<br/>⚠️ but NOT by trip generation (known bug)
```

## 3. Manage date exceptions (holidays / extra services)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as schedule detail
    participant CS as ScheduleController
    participant DB as Postgres

    MOT->>UI: add exception: 2026-02-04, type REMOVED (holiday)
    UI->>CS: POST /api/schedules/{id}/exceptions — auth
    CS->>DB: INSERT schedule_exception
    CS-->>UI: 201
    UI->>CS: GET /api/schedules/{id}/exceptions
    CS-->>UI: current exception list
    MOT->>UI: remove one
    UI->>CS: DELETE /api/schedules/{id}/exceptions/{exceptionId}
    CS-->>UI: 204
    Note over CS: ADDED = runs despite calendar,<br/>REMOVED = skipped despite calendar
```

## 4. Activate / deactivate / set status

```mermaid
sequenceDiagram
    actor MOT
    participant UI as schedule detail
    participant CS as ScheduleController
    participant SVC as ScheduleServiceImpl
    participant DB as Postgres

    MOT->>UI: click "Activate"
    UI->>CS: PUT /api/schedules/{id}/activate — auth
    CS->>SVC: activateSchedule(id, userId)
    SVC->>SVC: updateScheduleStatus(id, ACTIVE, userId)
    SVC->>DB: UPDATE schedule SET status = 'ACTIVE'
    SVC-->>UI: 200 — passengers can now find it
    Note over SVC: /deactivate → INACTIVE; PUT /{id}/status sets anything.<br/>⚠️ No transition matrix — CANCELLED → ACTIVE is accepted
```

## 5. Clone a schedule

Fast path for creating the return-direction or afternoon variant.

```mermaid
sequenceDiagram
    actor MOT
    participant UI as schedule detail
    participant CS as ScheduleController
    participant SVC as ScheduleServiceImpl
    participant DB as Postgres

    MOT->>UI: "Clone" on the 06:30 departure
    UI->>CS: POST /api/schedules/{id}/clone — auth
    CS->>SVC: cloneSchedule(id, userId)
    SVC->>DB: copy schedule header (new id, PENDING)
    SVC->>DB: copy schedule_stop rows
    SVC-->>UI: 201 new ScheduleResponse
    MOT->>UI: shift all times to 14:30, rename, activate
```

## 6. CSV import (optionally generating trips in the same pass)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as import page
    participant CS as ScheduleController
    participant SVC as ScheduleServiceImpl
    participant TS as TripServiceImpl
    participant DB as Postgres

    MOT->>UI: GET /api/schedules/import/template → CSV template
    MOT->>UI: upload filled CSV (rows may set generateTrips=true)
    UI->>CS: POST /api/schedules/import (multipart) — auth
    CS->>SVC: parse + validate rows
    loop each schedule row
        SVC->>DB: INSERT schedule + schedule_stop rows
        opt generateTrips flag set
            SVC->>TS: generateTripsForSchedule(newId, dates, userId)
            TS->>DB: INSERT trip per day in range
            Note over TS: ⚠️ same calendar-ignoring bug as workflow #7
        end
    end
    SVC-->>UI: ScheduleCsvImportResponse (per-row outcomes + trip counts)
```

## 7. Generate trips from a schedule

Delegates to the trips domain — shown fully in
[trips-workflows.md](trips-workflows.md) #1; abbreviated here for completeness.

```mermaid
sequenceDiagram
    actor MOT
    participant CS as ScheduleController
    participant TS as TripServiceImpl
    participant DB as Postgres

    MOT->>CS: POST /api/schedules/{id}/generate-trips?fromDate&toDate — auth
    CS->>TS: generateTripsForSchedule(id, from, to, userId)
    TS->>DB: read schedule + ordered schedule_stops
    TS->>TS: departure = first stop's time, arrival = last stop's time
    loop every day from→to
        TS->>DB: skip if (scheduleId, date) trip exists, else INSERT pending trip
    end
    TS-->>MOT: created TripResponse[]
```

## 8. Update / delete a schedule

```mermaid
sequenceDiagram
    actor MOT
    participant CS as ScheduleController
    participant SVC as ScheduleServiceImpl
    participant DB as Postgres

    MOT->>CS: PUT /api/schedules/{id} (header) or PUT /{id}/full (header + stops) — auth
    CS->>SVC: update…(id, request, userId)
    SVC->>DB: UPDATE schedule (+ replace schedule_stop rows on /full)
    SVC-->>MOT: 200
    MOT->>CS: DELETE /api/schedules/{id}
    CS->>SVC: deleteSchedule(id)
    SVC->>DB: DELETE schedule<br/>(cascades stops, calendar, exceptions)
    alt trips reference the schedule
        DB-->>SVC: ⚠️ FK violation → 500 (no pre-check)
    else clean
        SVC-->>MOT: 204
    end
```

## 9. Browse & inspect (list, by-route, statistics)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/schedules
    participant CS as ScheduleController

    UI->>CS: GET /api/schedules/statistics — stats cards
    UI->>CS: GET /api/schedules/filter-options/schedule-types + /statuses
    UI->>CS: GET /api/schedules?search=&status=&page= — paginated list
    MOT->>UI: open route view
    UI->>CS: GET /api/schedules/by-route/{routeId} — all timetables of one route
    MOT->>UI: open schedule detail
    UI->>CS: GET /api/schedules/{id} + GET /api/stops/schedule/{id}
    UI-->>MOT: header, per-stop times, calendar, exceptions
```

## 10. Passenger find-my-bus (the public read path over schedules)

The most complete consumer of the scheduling model — it applies stop order, schedule status,
calendar **and** exceptions.

```mermaid
sequenceDiagram
    actor PAX as Passenger (mobile)
    participant GW as api-gateway (public route)
    participant PQ as PassengerQueryController
    participant REPO as PassengerQueryRepository
    participant DB as Postgres

    PAX->>GW: GET /api/passenger/find-my-bus?fromStopId&toStopId&date (no auth)
    GW->>PQ: proxy
    PQ->>REPO: findMyBus(request)
    REPO->>DB: routes where from-stop precedes to-stop (route_stop order)
    REPO->>DB: join ACTIVE schedules + LEFT JOIN schedule_calendar<br/>filter by date's day-of-week
    REPO->>DB: apply schedule_exception for the date<br/>(ADDED in, REMOVED out)
    DB-->>PQ: matching services + times at both stops
    PQ-->>PAX: FindMyBusResponse (paginated)
    PAX->>PQ: GET /api/passenger/find-my-bus-details?... (drill-in)
    PQ-->>PAX: full per-stop timetable + trip info for booking
```
