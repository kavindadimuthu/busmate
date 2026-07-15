# Passenger Information — APIs & Front-end Workflows

Reference for the three passenger-information endpoints and how the two passenger apps consume them.
All three live on `PassengerQueryController` under `/api/passenger`, exposed **publicly** through the
gateway (`requiresAuth: false`).

## The three APIs

| # | Endpoint | Purpose | Consumed by |
|---|----------|---------|-------------|
| 1 | `GET /api/passenger/query/stops/search` | Stop autocomplete for origin/destination boxes | web SearchForm, mobile StopSearchInput |
| 2 | `GET /api/passenger/find-my-bus` | Journey search origin→destination → list of buses | web FindMyBusPage, mobile results screen |
| 3 | `GET /api/passenger/find-my-bus-details` | Full schedule/trip drill-down for one result | web FindMyBusDetailPage |

There is **no** stand-alone "list all routes", "route timetable by route number", "next departures
from this stop", "live vehicle position", or "fare" endpoint in the passenger surface. Everything is
funnelled through origin→destination search. (See [gaps](gaps-and-improvements.md).)

### 1. `GET /query/stops/search`

Params: `name?`, `city?`, `searchText?` (overrides name), `accessibleOnly?`, `page=0`, `size=20`
(max 100). Returns a paginated `PassengerStopResponse` list (`stopId, name, description, city,
location, isAccessible`). Matching is English name/description substring, in-memory.

### 2. `GET /find-my-bus`

Params and algorithm are documented in [journey-querying.md](journey-querying.md). Response
`FindMyBusResponse`:

```jsonc
{
  "success": true,
  "message": "Found 3 result(s).",
  "fromStop": { "id","name","nameSinhala","nameTamil","location" },
  "toStop":   { ... },
  "searchDate": "2026-02-08", "searchTime": "00:00", "timePreference": "DEFAULT",
  "totalResults": 3,
  "results": [ /* BusResult, see below */ ]
}
```

`BusResult` (abridged): `routeId, routeNumber, routeName(+Sinhala/Tamil), roadType, routeThrough,
routeGroup*, distanceKm, fromStopOrder, toStopOrder, scheduleId, scheduleName, scheduleType,
departureAtOrigin(+Source), arrivalAtDestination(+Source), scheduleStart/EndStop times,
scheduleTotalDistanceKm, hasTripData, tripId, tripStatus, actualDeparture/ArrivalTime,
busId/PlateNumber/Model/Capacity, operatorId/Name/Type, pspId/Number, alreadyDeparted,
statusMessage`.

### 3. `GET /find-my-bus-details`

Params: `scheduleId` (req), `fromStopId` (req), `toStopId` (req), `tripId?`, `date?`,
`timePreference=DEFAULT`. Response `FindMyBusDetailsResponse`: `route` (full route + route group),
`schedule` (metadata + `calendar` + `exceptions`), `routeScheduleStops[]` (every stop, all three
time tiers + resolved), `trip?` (bus/operator/PSP/delay), `journeySummary` (origin, destination,
intermediateStopCount, distanceKm, resolved departure/arrival + sources, estimatedDurationMinutes).

## Front-end A — passenger-web (React + Vite)

Client: `@busmate/api-client-core` → `PassengerQueryService`. Relevant screens:

```
HomePage ──search──▶ FindMyBusPage (/findmybus) ──select──▶ FindMyBusDetailPage (/findmybus/detail)
```

- **[SearchForm.tsx](../../apps/frontend/passenger-web/src/components/search/SearchForm.tsx)** —
  the reusable origin/destination/date widget. Debounced (300 ms, ≥2 chars) stop autocomplete,
  swap button, "Today/Tomorrow" quick-dates, and it mirrors its state into the URL query string so
  searches are shareable/bookmarkable. On submit it navigates to
  `/findmybus?fromStopId&toStopId&fromName&toName&date`. If no stop was selected it falls back to
  `fromText`/`toText` (which the results page then rejects).
- **[FindMyBusPage.tsx](../../apps/frontend/passenger-web/src/pages/FindMyBusPage.tsx)** — parses
  the URL, calls `findMyBus`, renders `BusCard`s with a `FilterSidebar` (departure-time, route
  number, road type, sort). Sorting is **client-side** (departure / duration / distance).
- **[FindMyBusDetailPage.tsx](../../apps/frontend/passenger-web/src/pages/FindMyBusDetailPage.tsx)**
  — calls `findMyBusDetails`, renders the summary card, `RouteMap` (Google Maps static polyline of
  stops), a stop-by-stop timeline with **view-mode** (All / With-times / Origin&Dest) and
  **time-tier** (Resolved / Verified / Unverified / Calculated) toggles, plus schedule / trip /
  route cards and an exceptions modal.

**Auth:** none of this requires login — the passenger-web `ProtectedRoute` only guards profile.

## Front-end B — passenger-mobile (Expo / React Native)

Client: `lib/api-client/route-management` → same `PassengerQueryService`. Relevant screens:

- **`app/(tabs)/search.tsx`** → **`app/search/results.tsx`** — the real journey search. `search.tsx`
  uses `StopSearchInput` (same `searchStops` API) and a filter modal; `results.tsx` calls
  `findMyBus(...)` and lists `BusResult`s. This path is **real** and backend-backed.
- **`app/(tabs)/location.tsx` → `app/tracking/input.tsx` → `app/tracking/map.tsx`** — a "track a
  bus / route on a live map" feature. ⚠️ **This is entirely mock.** `tracking/input.tsx` has
  hard-coded recent/popular routes and a `setTimeout` fake search; `tracking/map.tsx` calls
  `loadMockData()` and even simulates movement with `Math.random()` jitter. There is **no** live
  vehicle-position API behind it.
- **`app/search/booking|payment|seat-selection|...`** — these belong to the *ticketing* flow (seat
  maps, dummy payment), not the information layer.

## Where each front-end diverges

| Capability | passenger-web | passenger-mobile |
|------------|---------------|------------------|
| Stop autocomplete | ✅ real | ✅ real |
| Origin→destination search | ✅ real | ✅ real |
| Result → schedule detail page | ✅ real | ❌ (no detail screen wired) |
| "Track live bus" map | ❌ (route map is static stops) | ⚠️ mock data only |
| Time-tier / reliability UI | ✅ full toggles | partial |
| Login required for info | ❌ no | ❌ no |
</content>
