# Passenger Information on BusMate

How BusMate delivers **bus / route / schedule information to passengers** — the public "Find My
Bus" journey search, the stop autocomplete that feeds it, the schedule drill-down, and the two
passenger front-ends (passenger-web and passenger-mobile).

This is a *read-side* concern. It is deliberately separate from **ticketing** (booking a seat,
paying, validating on board), which lives in `ticketing-service` and is documented elsewhere. The
information layer answers "*which bus can take me from A to B, and when?*"; ticketing answers
"*reserve me a seat on it.*"

## The documents

| File | What it covers |
|------|----------------|
| [journey-querying.md](journey-querying.md) | The heart of the request: end-to-end walkthrough of **origin→destination journey search** (`GET /api/passenger/find-my-bus`), the SQL that matches stops, the three-tier time model, calendar/exception handling, and the schedule drill-down. |
| [apis-and-frontends.md](apis-and-frontends.md) | Reference for the three passenger information APIs, plus how passenger-web and passenger-mobile actually consume them (search form, results, detail page, "tracking"). |
| [gaps-and-improvements.md](gaps-and-improvements.md) | Evaluation: limitations, correctness gaps, dead contract fields, missing features (real-time position, fares, transfers), and a ranked improvement backlog. |

## The one-paragraph version

A passenger types an origin and a destination. The front-end turns each text box into a **stop
UUID** via a stop-autocomplete API (`GET /api/passenger/query/stops/search`). It then calls
`GET /api/passenger/find-my-bus?fromStopId=…&toStopId=…&date=…`, which runs a single native SQL
query in `core-service` that finds every **route** where the origin stop appears *before* the
destination stop, attaches the matching **schedule** (filtered to active + effective-window +
day-of-week calendar + dated exceptions), and optionally the concrete **trip** (a dated run of a
schedule with an assigned bus/operator/permit). Each result carries departure/arrival times tagged
with a **reliability source** (verified / unverified / calculated). Selecting a result calls
`GET /api/passenger/find-my-bus-details`, which returns the full stop-by-stop timetable, operating
calendar, exceptions, and trip/bus/operator detail for a map + timeline view.

## System shape

```mermaid
flowchart LR
    subgraph Clients
      W[passenger-web<br/>React + Vite]
      M[passenger-mobile<br/>Expo / React Native]
    end
    G[api-gateway<br/>/api/passenger/** is PUBLIC, no auth]
    C[core-service<br/>PassengerQueryController]
    DB[(Postgres/Supabase<br/>route, route_stop, schedule,<br/>schedule_stop, schedule_calendar,<br/>schedule_exception, trip, bus, operator, psp)]

    W -->|@busmate/api-client-route| G
    M -->|lib/api-client/route-management| G
    G -->|proxy, requiresAuth:false| C
    C --> DB
```

- **Gateway exposure**: `apps/backend/api-gateway/src/config/routes.config.ts` maps
  `/api/passenger` → `CORE_SERVICE` with `requiresAuth: false`. Passenger *information* is public;
  no login is required to search. (Login is only needed later, for booking/wallet/profile.)
- **Backend owner**: `core-service`, package
  `com.busmate.routeschedule.passengerinfo` — one controller, one service, one repository, a set of
  response DTOs, and two DB projections.
- **Generated clients**: both front-ends call a generated OpenAPI client
  (`PassengerQueryService`) so the request/response shapes are the controller's contract verbatim.

## Core domain vocabulary

| Term | Meaning |
|------|---------|
| **Stop** | A physical boarding point. Trilingual name (EN/Sinhala/Tamil), location, accessibility flag. |
| **Route** | An ordered chain of stops (`route_stop` rows with `stop_order` + `distance_from_start_km`). Has a number, road type (NORMALWAY/EXPRESSWAY), "via" text. |
| **Schedule** | A timetable laid over a route: per-stop arrival/departure times, an effective date window, a weekly **calendar**, and dated **exceptions**. |
| **Trip** | One dated execution of a schedule, with an assigned bus, operator and passenger-service-permit (PSP), plus actual (real) times. |
| **Time source** | Every schedule time is one of three tiers — **verified**, **unverified**, **calculated** — surfaced to the passenger as a reliability badge. |
</content>
</invoke>
