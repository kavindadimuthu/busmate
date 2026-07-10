# Stage 1 — Infrastructure Planning (pre-planning)

**What this stage means in transit practice:** long-horizon decisions about the physical
system — corridor studies, demand modelling, terminal/depot/interchange siting, stop placement
and spacing, right-of-way, park-and-ride, accessibility works. Inputs are census/land-use/OD
(origin–destination) demand data; outputs are the physical network the service layer runs on.

## What BusMate has today

Essentially nothing at this stage — and most of it is legitimately out of scope for an
operations platform. What *does* exist is the downstream registry of the results:

- **Stop master data** (`network` package, `/api/stops`): trilingual names/addresses,
  latitude/longitude, an `isAccessible` flag, CSV import/template/export. This is a *record* of
  stop-placement decisions made elsewhere, not a tool for making them.
- **Operator & permit registry** (`fleet.Operator`, `licensing.PassengerServicePermit`): records
  who is licensed to serve which route group — the institutional infrastructure, not physical.

There are **no entities** for terminals, depots, interchanges, or corridors; no demand or
land-use data anywhere; no catchment/coverage analysis; no map-based planning tools beyond a
lat/long picker on the stop form.

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| No terminal/depot concept | Medium | Bites later: vehicle scheduling (stage 4) has no "where does the bus start/end the day", and dead-heading can never be modelled without it. Terminals also matter for passenger info (major stops vs. wayside poles are currently the same entity). |
| No stop classification | Low–Medium | A `Stop` has no type (terminal / interchange / regular / request), no shelter/amenity data beyond one accessibility boolean. |
| No coverage or spacing analysis | Low | With lat/long already stored, "population within 400 m of a stop" or "stops closer than X m that may be duplicates" are cheap wins if BusMate ever wants to support planners. The route-network docs already flag stop merge/dedup tooling. |
| No demand data model | Low (scope call) | OD matrices, boarding counts, survey data — none exists. Realistically BusMate's own ticketing data (stage 8) is the future demand source; that loop matters more than importing external demand data. |

## Improvement candidates

1. **Add a `stopType` enum + terminal entity (or a self-referencing "parent station" like GTFS
   `parent_station`).** Cheap, unblocks depot-aware vehicle scheduling and better passenger UX.
2. **Nearest-stop / geo queries** on the existing lat/long columns (also listed in the
   route-network gap list) — serves passengers now and planners later.
3. **Defer everything else.** Corridor studies and demand modelling belong in GIS/planning tools;
   BusMate's leverage is exporting clean data (stops CSV already exists; add GeoJSON) for those
   tools rather than reimplementing them.

**Verdict: 🔴 absent — mostly a deliberate and reasonable scope boundary, except the missing
terminal/depot concept, which stages 4 and 6 will eventually need.**
