# Route Workflows — Sequence Diagrams

Task-by-task sequence diagrams for route groups, routes and route-stop sequences.

Common participants: **MOT** (management-portal `app/mot/routes/`), **GW** (api-gateway,
`/api/routes` JWT-protected), **CS** (core-service `RouteController → RouteService /
RouteGroupService / RouteImportExportService`), **DB** (Postgres `route_group`, `route`,
`route_stop`). The auth hop (gateway proxy → core-service JWT filter → `userId`) is identical to
the one drawn in [stops-workflows.md](stops-workflows.md) and abbreviated below.

## 1. Create a route group (a bus "line")

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/routes
    participant CS as RouteController
    participant SVC as RouteGroupServiceImpl
    participant DB as Postgres

    MOT->>UI: "New route group" → name (EN/SI/TA) + description
    UI->>CS: POST /api/routes/groups (RouteGroupRequest) — auth
    CS->>SVC: createRouteGroup(request, userId)
    SVC->>DB: INSERT INTO route_group
    SVC-->>UI: 201 RouteGroupResponse
    UI-->>MOT: group appears in list; detail at /mot/routes/[routeGroupId]
```

## 2. Create a route in the workspace (form mode)

The main authoring flow: a directional route with its ordered stop sequence, submitted as one
`RouteRequest` (stops embedded).

```mermaid
sequenceDiagram
    actor MOT
    participant WS as Route Workspace (form mode)
    participant LS as localStorage (draft)
    participant CS as RouteController
    participant SVC as RouteServiceImpl
    participant DB as Postgres

    MOT->>WS: open workspace (new route for group X)
    WS->>CS: GET /api/stops/all — populate stop picker
    MOT->>WS: set number, direction (OUTBOUND), road type,<br/>distanceKm, duration, trilingual names
    MOT->>WS: add stops in order + distance-from-start per stop
    WS-->>LS: autosave draft (DraftRecoveryBanner restores on crash)
    MOT->>WS: Submit → RouteSubmissionModal review
    WS->>CS: POST /api/routes (RouteRequest incl. routeStops[]) — auth
    CS->>SVC: createRoute(request, userId)
    SVC->>DB: INSERT route
    SVC->>DB: INSERT route_stop × n (stopOrder, distanceFromStartKm)
    SVC-->>WS: 201 RouteResponse
    WS-->>MOT: success → back to group detail
    Note over MOT,WS: repeat for the INBOUND variant —<br/>no auto-mirroring exists (known gap)
```

## 3. AI Studio: generate a route draft with Gemini

The AI never writes to core-service — it only produces a draft that lands in form mode for review.

```mermaid
sequenceDiagram
    actor MOT
    participant AI as Route Workspace (AI Studio)
    participant NX as Next.js API route<br/>/api/ai/generate-route
    participant GM as Google Gemini<br/>(gemini-2.5-flash)
    participant FM as Form mode (same draft state)

    MOT->>AI: prompt: "Route 138 Colombo–Kandy via Kadawatha, expressway…"
    AI->>NX: POST /api/ai/generate-route {systemPrompt, userPrompt}
    Note over NX: GEMINI_API_KEY stays server-side
    NX->>GM: generateContent(model, prompts, temperature, maxTokens)
    GM-->>NX: structured route JSON (stops, order, distances)
    NX-->>AI: draft payload
    AI->>FM: hydrate workspace draft state
    MOT->>FM: review / correct stop IDs against real stops
    FM->>FM: continue as workflow #2 (submit via RouteSubmissionModal)
    Note over NX: ⚠️ portal split: Vite portals have no server —<br/>this proxy must move to the api-gateway BFF
```

## 4. Textual mode: paste-and-parse editing

```mermaid
sequenceDiagram
    actor MOT
    participant TM as Textual mode
    participant ST as Shared workspace draft state
    participant FM as Form mode

    MOT->>TM: paste / type route as structured text
    TM->>TM: parse text → draft fields + stop rows
    TM->>ST: update shared draft
    MOT->>FM: switch tabs — same draft, structured view
    FM->>ST: edits flow back
    MOT->>TM: switch back — text regenerated from draft
    Note over TM,FM: both modes end in the same submission modal (workflow #2)
```

## 5. Update a route

```mermaid
sequenceDiagram
    actor MOT
    participant WS as Workspace (edit mode)
    participant CS as RouteController
    participant SVC as RouteServiceImpl
    participant DB as Postgres

    WS->>CS: GET /api/routes/{id} — load existing route + stops
    MOT->>WS: modify fields / reorder / add / remove stops
    WS->>CS: PUT /api/routes/{id} (full RouteRequest) — auth
    CS->>SVC: updateRoute(id, request, userId)
    SVC->>DB: UPDATE route
    SVC->>DB: replace route_stop rows (orphanRemoval cascade)
    SVC-->>WS: 200 RouteResponse
    Note over DB: ⚠️ no versioning — existing schedules/trips<br/>now silently point at the changed route
```

## 6. Delete a route / route group

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/routes
    participant CS as RouteController
    participant SVC as RouteServiceImpl
    participant DB as Postgres

    MOT->>UI: delete route (confirm dialog)
    UI->>CS: DELETE /api/routes/{id} — auth
    CS->>SVC: deleteRoute(id)
    SVC->>DB: DELETE route (cascades route_stop)
    alt no schedules reference the route
        DB-->>UI: 204 — gone
    else schedules exist
        DB-->>SVC: ⚠️ FK violation (schedule.route_id)
        SVC-->>UI: ⚠️ 500 — no pre-check (known gap)
    end
    Note over MOT: DELETE /api/routes/groups/{id} behaves the same<br/>one level up (routes cascade, schedules block)
```

## 7. Unified CSV import (group + routes + stops in one file)

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/routes/import
    participant CS as RouteController
    participant IES as RouteImportExportServiceImpl
    participant DB as Postgres

    MOT->>UI: GET /api/routes/import/template → download CSV
    MOT->>UI: upload filled CSV
    UI->>CS: POST /api/routes/import (multipart, RouteUnifiedImportRequest) — auth
    CS->>IES: parse rows (group / route / stop-sequence columns)
    IES->>DB: upsert route_group
    loop each route row
        IES->>DB: INSERT route
        IES->>DB: INSERT route_stop × n (resolving stop names → ids)
    end
    IES-->>UI: RouteUnifiedImportResponse (per-row outcomes)
    UI-->>MOT: results table
```

## 8. Filtered export

```mermaid
sequenceDiagram
    actor MOT
    participant CS as RouteController
    participant IES as RouteImportExportServiceImpl
    participant DB as Postgres

    MOT->>CS: POST /api/routes/export (RouteExportRequest filters) — auth
    CS->>IES: export(filters)
    IES->>DB: filtered SELECT (routes + stop sequences)
    IES-->>MOT: RouteExportResponse → CSV download
```

## 9. Browse list / group detail

```mermaid
sequenceDiagram
    actor MOT
    participant UI as /mot/routes and /mot/routes/[routeGroupId]
    participant CS as RouteController

    UI->>CS: GET /api/routes/statistics — stats cards
    UI->>CS: GET /api/routes/filters/options — dropdowns
    UI->>CS: GET /api/routes/groups?search=&page= — paginated groups
    MOT->>UI: open a group
    UI->>CS: GET /api/routes/groups/{id} — group + its routes
    UI->>CS: GET /api/stops/route-group/{id} — union of stops
    UI-->>MOT: group detail: directional variants + stop map
```

## 10. Operator reads their own routes

Read-only slice scoped through the operator's permits; ownership enforced server-side.

```mermaid
sequenceDiagram
    actor OP as Operator (portal)
    participant GW as api-gateway
    participant BOC as BusOperatorController
    participant DB as Postgres

    OP->>GW: GET /api/v1/bus-operator/{operatorId}/routes + JWT
    GW->>BOC: proxy
    BOC->>BOC: verify JWT user belongs to operatorId
    BOC->>DB: routes reachable via the operator's<br/>permits → trips → schedules → routes
    DB-->>OP: routes this operator serves
```
