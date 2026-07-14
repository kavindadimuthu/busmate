# Journey Querying — "Find My Bus" (origin → destination)

This is the flagship passenger-information workflow: **give an origin and a destination (and
optionally a date/time), get back the buses that run between them.** This document traces it from
the search box down to the SQL and back.

Source of truth:
- Backend: `apps/backend/core-service/.../passengerinfo/`
  ([controller](../../apps/backend/core-service/src/main/java/com/busmate/routeschedule/passengerinfo/controller/PassengerQueryController.java),
  [service](../../apps/backend/core-service/src/main/java/com/busmate/routeschedule/passengerinfo/service/impl/PassengerQueryServiceImpl.java),
  [repository](../../apps/backend/core-service/src/main/java/com/busmate/routeschedule/passengerinfo/repository/PassengerQueryRepository.java))
- Frontend (web): [SearchForm.tsx](../../apps/frontend/passenger-web/src/components/search/SearchForm.tsx),
  [FindMyBusPage.tsx](../../apps/frontend/passenger-web/src/pages/FindMyBusPage.tsx),
  [FindMyBusDetailPage.tsx](../../apps/frontend/passenger-web/src/pages/FindMyBusDetailPage.tsx)

## 1. The end-to-end flow

```mermaid
sequenceDiagram
    participant U as Passenger
    participant F as SearchForm
    participant S as /query/stops/search
    participant P as FindMyBusPage
    participant B as /find-my-bus
    participant D as FindMyBusDetailPage
    participant DT as /find-my-bus-details

    U->>F: types "Colombo" in "From"
    F->>S: searchStops(searchText="Colombo")  (debounced 300ms, min 2 chars)
    S-->>F: [{stopId, name, city}, ...]
    U->>F: picks a stop (captures fromStopId UUID)
    Note over F: repeat for "To"; pick a date (default today)
    U->>F: Find My Bus
    F->>P: navigate /findmybus?fromStopId&toStopId&date
    P->>B: findMyBus(fromStopId, toStopId, date, time?, routeNumber?, roadType?, timePreference)
    B-->>P: { fromStop, toStop, results:[BusResult...] }
    U->>P: clicks a result (BusCard)
    P->>D: navigate /findmybus/detail?scheduleId&fromStopId&toStopId&tripId?&date
    D->>DT: findMyBusDetails(scheduleId, fromStopId, toStopId, tripId?, date, timePreference)
    DT-->>D: { route, schedule(all stops), calendar, exceptions, trip, journeySummary }
```

**Critical design point:** the search is keyed on **stop UUIDs, not free text.** The text boxes are
only an autocomplete affordance; the actual journey query requires a resolved `fromStopId` and
`toStopId`. If the user types text but never selects a suggestion, the web app falls back to a URL
with `fromText`/`toText` and the results page refuses to search (`"Please select valid stops"`).
There is **no text→journey resolution** on the backend — see limitations.

## 2. Stop autocomplete — `GET /api/passenger/query/stops/search`

Feeds the two text boxes. The front-end debounces at 300 ms and only fires at ≥ 2 characters
(`SearchForm.searchStops`). Backend
(`PassengerQueryServiceImpl.searchStops`):

- Loads **all** stops with `stopRepository.findAll()` and filters **in memory** by
  name/description substring (case-insensitive), optional exact `city`, optional `accessibleOnly`.
- Paginates the in-memory list (`page`, `size ≤ 100`).

Returns `PassengerPaginatedResponse<PassengerStopResponse>` — `{ stopId, name, description, city,
location, isAccessible }`. Note the query only matches English `name`/`description`; Sinhala/Tamil
names are returned but **not searchable**, and the `findAll()`-then-filter approach does not scale
(see [gaps](gaps-and-improvements.md)).

## 3. The journey search — `GET /api/passenger/find-my-bus`

### Request parameters

| Param | Required | Default | Purpose |
|-------|----------|---------|---------|
| `fromStopId` (UUID) | ✅ | — | Origin stop |
| `toStopId` (UUID) | ✅ | — | Destination stop |
| `date` | — | today | Which day to evaluate calendar/exceptions/trips against |
| `time` | — | `00:00` | Lower bound — results departing **before** this are dropped |
| `routeNumber` | — | — | Exact-match filter |
| `roadType` | — | — | `NORMALWAY` / `EXPRESSWAY` |
| `timePreference` | — | `DEFAULT` | How to resolve the 3-tier times (see §5) |

### The matching algorithm (`PassengerQueryServiceImpl.findMyBus`)

1. **Validate stops** — both UUIDs must resolve to a `Stop`, else an error response.
2. **Run one native query** (`findBusesBetweenStops`) that returns a flat projection row per
   (route × schedule × optional-trip) candidate.
3. **Per-row post-processing** (`processProjection`) filters/keeps each candidate:
   - Must have a `scheduleId` (schedule-less routes are dropped — a route with no timetable never
     appears).
   - Drop if the schedule has a `REMOVED` exception for `date`.
   - Unless the date is an `ADDED` exception, drop if the weekly **calendar** says the schedule
     doesn't run on that day-of-week.
   - Resolve the origin departure time by `timePreference`; **drop if null or before `time`.**
   - Resolve the destination arrival time.
4. **Sort** by resolved departure time, then by distance, and return.

### The SQL that finds "buses between two stops"

The whole match is a single native query (`PassengerQueryRepository.findBusesBetweenStops`). Its
spine:

```sql
FROM route_stop rs1
INNER JOIN route r        ON rs1.route_id = r.id
INNER JOIN route_stop rs2 ON rs2.route_id = r.id          -- same route, second stop
LEFT  JOIN route_group rg ON r.route_group_id = rg.id
LEFT  JOIN schedule s      ON s.route_id = r.id
       AND s.status = 'ACTIVE'
       AND s.effective_start_date <= :searchDate
       AND (s.effective_end_date IS NULL OR s.effective_end_date >= :searchDate)
LEFT  JOIN schedule_stop ss1 ON ss1.schedule_id = s.id AND ss1.stop_order = rs1.stop_order
LEFT  JOIN schedule_stop ss2 ON ss2.schedule_id = s.id AND ss2.stop_order = rs2.stop_order
LEFT  JOIN schedule_calendar sc ON sc.schedule_id = s.id
LEFT  JOIN trip t          ON t.schedule_id = s.id AND t.trip_date = :searchDate
       AND t.status IN ('pending','active','in_transit','boarding','departed','delayed','completed')
LEFT  JOIN bus b           ON t.bus_id = b.id
LEFT  JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id
LEFT  JOIN operator op     ON psp.operator_id = op.id
WHERE rs1.stop_id = :fromStopId
  AND rs2.stop_id = :toStopId
  AND rs1.stop_order < rs2.stop_order            -- ← direction: origin BEFORE destination
  AND (:routeNumber IS NULL OR r.route_number = :routeNumber)
  AND (:roadType   IS NULL OR r.road_type     = :roadType)
```

Things worth knowing:

- **Direction is enforced by `rs1.stop_order < rs2.stop_order`.** A route only matches if it visits
  the origin earlier in its stop sequence than the destination. The reverse direction is a separate
  `route` row (routes are directional), so the swap button in the UI genuinely re-queries.
- **`schedule_stop` is joined on `stop_order`, not `route_stop_id`** — a deliberate robustness
  choice noted in the code (stop_order is the stable logical key even if IDs drift).
- **The operator/permit chain is `trip → psp → operator`**, so operator/bus info only exists when a
  concrete **trip** has been generated for that date. A schedule with no trip still returns as a
  "Scheduled service" result, just without bus/operator/plate.
- The query's own `ORDER BY` prioritises rows that have a trip, then a schedule, then bare routes —
  but the service re-sorts in Java afterward.

### A BusResult (search row)

`buildBusResult` produces, per result: route identity (number, name ×3 languages, road type,
"via"), route group, `distanceKm` between the two stops, `scheduleId` + name + type,
`departureAtOrigin` + `departureAtOriginSource`, `arrivalAtDestination` + source, the schedule's
own start/end-stop times and total distance, and — **if a trip exists** — `tripId`, `tripStatus`,
`busPlateNumber`, `busModel`, `busCapacity`, `operatorName`, `operatorType`, `pspNumber`,
`alreadyDeparted`, and a human `statusMessage` ("Scheduled service (verified times)", "Trip
scheduled (estimated times)", "Trip completed", …).

## 4. The drill-down — `GET /api/passenger/find-my-bus-details`

Called when a passenger selects a result. Inputs: `scheduleId`, `fromStopId`, `toStopId`, optional
`tripId`, `date`, `timePreference`. Logic (`findMyBusDetails`):

1. Validate both stops and the schedule exist.
2. Load **all** schedule stops in order (`findScheduleStopsByScheduleId`).
3. Locate origin/destination indices; error if origin doesn't come before destination.
4. Build the weekly `calendar`, the full `exceptions` list, and a `RouteScheduleStop[]` (every stop
   with all three time tiers + a resolved time).
5. If `tripId` given, load the `Trip` → bus / operator / PSP / delay.
6. Build a `journeySummary` (origin, destination, intermediate-stop count, distance, resolved
   departure/arrival, estimated duration).

The web detail page renders this as: a journey-summary card, a Google-Maps route map
([RouteMap.tsx](../../apps/frontend/passenger-web/src/components/RouteMap.tsx) — static stop
polyline, **not** a live bus position), a scrollable stop-by-stop timeline with view-mode and
time-tier toggles, and schedule/trip/route detail cards.

## 5. The three-tier time model (the interesting bit)

Every schedule stop stores each time **three times over**:

| Tier | Column suffix | Meaning | Badge |
|------|---------------|---------|-------|
| **Verified** | (none) | Confirmed by an authority | green ✓ |
| **Unverified** | `_unverified` | User/operator-submitted, not confirmed | yellow ⚠ |
| **Calculated** | `_calculated` | System-estimated from average travel times | blue 🖩 |

`timePreference` selects the fallback chain (`resolveTime`):

- `VERIFIED_ONLY` → verified, else `UNAVAILABLE` (fewest, most reliable results).
- `PREFER_UNVERIFIED` → verified → unverified → `UNAVAILABLE`.
- `PREFER_CALCULATED` / `DEFAULT` → verified → unverified → calculated → `UNAVAILABLE`.

Each returned time carries its resolved **source** so the UI can badge reliability. The detail page
additionally lets the user view any single tier in isolation. This tri-tier scheme is a genuine
strength — it lets the platform surface *partial* timetable knowledge honestly rather than pretending
every time is authoritative. **Note the front-ends always send `DEFAULT`** and never expose the
preference to the user (the web filter has a `timePreference` control in state but hard-codes
`'DEFAULT'` in the API call).

## 6. Calendar & exception semantics

- **Weekly calendar** (`schedule_calendar`): booleans per weekday. A null calendar is treated as
  "runs every day" (`isValidForDayOfWeek`).
- **Dated exceptions** (`schedule_exception`): `REMOVED` cancels the schedule for that date (drops
  it from results even if the weekday matches); `ADDED` forces it in (bypasses the weekday check).

This mirrors the GTFS calendar/calendar_dates idea and is applied **consistently at query time** —
the passenger search is calendar-aware even though (per the network-ops docs) *trip generation*
currently is not, which can make the two disagree.
</content>
