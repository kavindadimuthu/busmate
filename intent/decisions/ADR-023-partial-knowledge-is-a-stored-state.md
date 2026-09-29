# ADR-023 · Partial knowledge is a stored state, not a validation failure

**Date:** 2026-09-25 · **Status:** Accepted
**Type:** architecture

## Context

BusMate's network data is going to arrive incomplete: a contributor knows a route's endpoints and number but
not its intermediate stops; a timetable board gives a departure time and no arrival. The Embilipitiya post
(a community timetable of ~230 departures) is typical — its route 03 header names two endpoints and lists no
stops, while its own fare table names Pelmadulla, Ratnapura and Kaduwela, which no departure line mentions.

Today the system cannot hold that honestly, for three separate reasons, verified against the code:

- **The API is stricter than the database.** `RouteRequest` requires `routeGroupId`, `startStopId`,
  `endStopId` and `direction`; all four columns are nullable. `RouteServiceImpl.create/update` then calls
  `findById` on the start and end stop, so relaxing the annotation alone would only move the failure.
- **`schedule.effective_start_date` is `NOT NULL`**, and passenger search filters on
  `effective_start_date <= :date`, so a schedule with no start date would silently vanish from search.
- **There is no way to say "this list is incomplete."** A route stored with four of twenty stops is
  indistinguishable from a complete one, so the passenger who searches Pelmadulla → Colombo finds nothing
  and cannot tell whether the bus doesn't go there or BusMate doesn't know.

## Options considered

1. **Stay strict; contributors fill every field.** They will guess or transliterate. The first source of
   real data (a Facebook post) cannot be entered at all.
2. **Relax validation only.** Data can be stored, but a partial route is shown as if complete.
3. **Sentinel values and a five-way "unknown / not applicable / not collected / blank / absent" state.**
   Across the 230 departures there is no case that needs more than "known" and "not known"; the other
   three are states of a *contribution*, which the changeset already records.
4. **Relax validation and mark collections as complete or not.** *(chosen)*

## Decision

**Option 4.** `NULL` means "not known" and nothing else.

- **Validation matches storage, and the services follow.** `routeGroupId`, `startStopId`, `endStopId` and
  `direction` become optional on a route, and `RouteServiceImpl` handles their absence.
- **A schedule's start date stays `NOT NULL`, and defaults.** It becomes optional in the request and
  defaults to the observation date for a contribution, today for staff. "In effect as of when we saw it" is
  true; `NULL` in a column search compares against is a silent hiding place.
- **Two completeness columns, both defaulting to `UNKNOWN`.**
  `route.stop_list_completeness` ∈ `COMPLETE | PARTIAL | UNKNOWN` and
  `schedule.timing_completeness` ∈ `ALL_STOPS | ENDPOINTS_ONLY | ORIGIN_ONLY | UNKNOWN`. Only someone
  asserting `COMPLETE` or `ALL_STOPS` is making a claim, so those are only ever set by a person: staff, or a
  reviewed contribution. Nothing infers them, and existing rows stay `UNKNOWN` until an owner who knows says
  otherwise.
- **A route's endpoints are stops of the route.** A route created with known endpoints and no stop list gets
  `route_stop` rows for those two, because a schedule time can only attach to a `route_stop`
  (`schedule_stop.route_stop_id` is `NOT NULL`); without them an origin-only departure has nowhere to go.
- **The server sends the marker, never the wording** — the same rule `TrustLabels` follows — so each app
  words "this route may also serve other stops" itself.
- **Process states stay on the changeset.** "Not yet collected" and "intentionally blank" describe a
  contribution, not the world, and are not added to canonical tables.

## Consequences

- **The marker explains a gap; it does not fill it.** Pelmadulla → Colombo still finds nothing until someone
  adds Pelmadulla as a stop of the route. What changes is that route detail can say the list is partial
  instead of implying it is complete. Adding stops by proposal is a separate, later increment.
- **Trip generation still needs a first departure and a last arrival**, so an `ORIGIN_ONLY` schedule is
  shown to passengers as timetable information but does not materialise trips until an arrival is known.
- **Frontends must guard first.** Five files dereference a route's start or end stop without a null check —
  `RouteMap.tsx` and `scheduleValidation.ts` and `routeWorkspaceMap.ts` in the portal, `stopView.tsx` in
  conductor-mobile, and the passenger-mobile ticket detail. The generated types already mark the fields
  optional and only `RouteImportExportServiceImpl` reads them in the backend. CI covers backend only, so
  these guards ship in the same increment as the relaxation and are checked by hand.
- **One additive migration**, two columns with `CHECK` constraints. No existing row changes meaning.
- `schedule_calendar` cannot say "days unknown" (seven required booleans; the post has a vague "weekdays").
  Not solved here: no case needs it yet, and a calendar marker can follow the same pattern.

## Revisit when

- A third collection needs the same treatment (calendar days, a route's geometry), which suggests one
  generic completeness mechanism instead of a column each.
- Passengers report a partial route as wrong rather than incomplete, which would mean the marker is not
  being read.
