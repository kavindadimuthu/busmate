# Stop Workflows — Sequence Diagrams

Task-by-task sequence diagrams for the stops domain. Common participants:

- **MOT** — ministry staff in the new-react-portal (`src/pages/mot/stops/`)
- **GW** — api-gateway (`routes.config.ts`: `/api/stops` requires JWT; `/api/passenger` is public)
- **CS** — core-service (`JwtAuthenticationFilter` re-validates the JWT, controller reads
  `authentication.getName()` as `userId`, then `StopController → StopService(Impl)`)
- **DB** — Postgres (`stop`, `route_stop` tables)

All authenticated flows share the same first hop, so it is drawn once here and abbreviated as
*"auth"* in later diagrams:

```mermaid
sequenceDiagram
    participant UI as Portal / App
    participant GW as api-gateway
    participant CS as core-service

    UI->>GW: request + Bearer JWT
    GW->>GW: route match (/api/stops → CORE_SERVICE, requiresAuth)
    GW->>CS: proxy request (JWT forwarded)
    CS->>CS: JwtAuthenticationFilter → UserPrincipal(userId, roles)
    CS->>CS: controller: userId = authentication.getName()
```

## 1. Create a single stop

The create form checks for duplicates before submitting.

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/stops/create
    participant GW as api-gateway
    participant CS as StopController
    participant SVC as StopServiceImpl
    participant DB as Postgres

    MOT->>UI: fill EN/SI/TA names, address, map pin, accessibility
    UI->>GW: GET /api/stops/exists?name=... (auth)
    GW->>CS: proxy
    CS->>SVC: stopExists(name, ...)
    SVC->>DB: SELECT ... FROM stop WHERE ...
    DB-->>UI: StopExistsResponse
    alt already exists
        UI-->>MOT: warn, keep editing
    else unique
        UI->>GW: POST /api/stops (StopRequest)
        GW->>CS: proxy
        CS->>SVC: createStop(request, userId)
        SVC->>DB: INSERT INTO stop (createdBy = userId)
        DB-->>SVC: row
        SVC-->>UI: 201 StopResponse
        UI-->>MOT: redirect to stop detail / list
    end
```

## 2. Batch create

Used by seeding scripts and multi-row forms; one transaction, many stops.

```mermaid
sequenceDiagram
    participant C as Client (script / UI)
    participant CS as StopController
    participant SVC as StopServiceImpl
    participant DB as Postgres

    C->>CS: POST /api/stops/batch (StopBatchCreateRequest[n]) — auth
    CS->>SVC: batchCreate(requests, userId)
    loop each stop
        SVC->>SVC: validate row
        SVC->>DB: INSERT INTO stop
    end
    SVC-->>C: StopBatchCreateResponse (created ids + per-row outcome)
```

## 3. Browse, search & filter the list

The list page composes three endpoints: statistics cards, filter options, and the paginated query.

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/stops (table + map views)
    participant CS as StopController
    participant DB as Postgres

    UI->>CS: GET /api/stops/statistics (auth)
    CS-->>UI: StopStatisticsResponse → stats cards
    UI->>CS: GET /api/stops/filters/options
    CS-->>UI: distinct cities/states → filter dropdowns
    MOT->>UI: type search, pick filters, change page
    UI->>CS: GET /api/stops?search=&city=&page=&size=&sort=
    CS->>DB: paged SELECT with predicates
    DB-->>UI: PaginatedResponse<StopResponse>
    MOT->>UI: toggle map view
    UI-->>MOT: same result set rendered as lat/long markers
```

## 4. View a stop (detail page)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/stops/[busStopId]
    participant CS as StopController

    UI->>CS: GET /api/stops/{id} (auth)
    CS-->>UI: StopResponse (trilingual fields, location, audit info)
    UI-->>MOT: detail view with map pin
```

## 5. Update a stop

```mermaid
sequenceDiagram
    actor MOT
    participant UI as stop detail (edit)
    participant CS as StopController
    participant SVC as StopServiceImpl
    participant DB as Postgres

    MOT->>UI: edit fields, save
    UI->>CS: PUT /api/stops/{id} (StopRequest) — auth
    CS->>SVC: updateStop(id, request, userId)
    SVC->>DB: SELECT stop by id
    alt not found
        SVC-->>UI: 404 ResourceNotFoundException
    else found
        SVC->>DB: UPDATE stop (updatedBy = userId)
        SVC-->>UI: 200 StopResponse
    end
```

## 6. Delete a stop (including the current failure mode)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/stops
    participant CS as StopController
    participant SVC as StopServiceImpl
    participant DB as Postgres

    MOT->>UI: click delete → confirmation modal
    UI->>CS: DELETE /api/stops/{id} (auth)
    CS->>SVC: deleteStop(id)
    SVC->>DB: existsById(id)?
    alt not found
        SVC-->>UI: 404
    else exists, unreferenced
        SVC->>DB: DELETE FROM stop
        SVC-->>UI: 204 → row disappears from table
    else exists, referenced by route_stop
        SVC->>DB: DELETE FROM stop
        DB-->>SVC: ⚠️ FK constraint violation
        SVC-->>UI: ⚠️ 500 (no reference pre-check — known gap)
    end
```

## 7. CSV import (create) and upsert import

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/stops/import
    participant CS as StopController
    participant IES as StopImportExportServiceImpl
    participant DB as Postgres

    MOT->>UI: download template
    UI->>CS: GET /api/stops/import/template (auth)
    CS-->>MOT: CSV template file
    MOT->>UI: upload filled CSV
    alt create-only import
        UI->>CS: POST /api/stops/import (multipart)
    else idempotent re-run
        UI->>CS: PUT /api/stops/import/upsert (multipart)
    end
    CS->>IES: parse + validate rows
    loop each row
        IES->>DB: INSERT (or UPDATE on upsert match)
    end
    IES-->>UI: StopImportResponse — per-row: created / updated / failed + reason
    UI-->>MOT: results table (failed rows fixable and re-uploadable)
```

## 8. Filtered export

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/stops/export
    participant CS as StopController
    participant IES as StopImportExportServiceImpl
    participant DB as Postgres

    MOT->>UI: choose filters (same facets as list page)
    UI->>CS: POST /api/stops/export (StopExportRequest) — auth
    CS->>IES: export(filters)
    IES->>DB: filtered SELECT
    IES-->>UI: StopExportResponse → CSV download
```

## 9. Relationship lookups (used by other pages, not the stops UI itself)

```mermaid
sequenceDiagram
    participant RUI as Route detail page
    participant SUI as Schedule detail page
    participant CS as StopController
    participant DB as Postgres

    RUI->>CS: GET /api/stops/route/{routeId} (auth)
    CS->>DB: join route_stop → stop ORDER BY stop_order
    CS-->>RUI: ordered stops + distanceFromStartKm
    SUI->>CS: GET /api/stops/schedule/{scheduleId}
    CS->>DB: join schedule_stop → route_stop → stop
    CS-->>SUI: ordered stops + arrival/departure times
```

## 10. Public stop search (passenger)

No JWT — the gateway routes `/api/passenger` unauthenticated.

```mermaid
sequenceDiagram
    actor PAX as Passenger (mobile)
    participant GW as api-gateway
    participant PQ as PassengerQueryController
    participant DB as Postgres

    PAX->>GW: GET /api/passenger/query/stops/search?q=Kandy (no auth)
    GW->>PQ: proxy (public route)
    PQ->>DB: name search (EN/SI/TA) with pagination
    DB-->>PQ: matches
    PQ-->>PAX: PassengerPaginatedResponse<PassengerStopResponse>
    Note over PAX: feeds the from/to pickers of find-my-bus
```
