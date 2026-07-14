# Stage 2 — Network Design

**What this stage means in transit practice:** deciding the route structure — which corridors
get lines, where routes start/end, stop sequences, directness vs. coverage trade-offs, transfer
points, route hierarchy (trunk/feeder/express). Outputs: the route map.

## What BusMate has today

This is one of BusMate's strongest areas **as a registry** (see
[routes.md](../route-network-and-operations/routes.md) for internals):

- **RouteGroup → directional Routes** model: a group holds OUTBOUND/INBOUND variants; each route
  has a number, road type (`NORMALWAY`/`EXPRESSWAY`), start/end stops, distance and estimated
  duration. Trilingual (EN/Si/Ta) throughout.
- **Ordered RouteStop sequences** with per-stop distance-from-start, in three data-quality tiers
  (verified / unverified / calculated — only verified is consumed).
- **Authoring UX well beyond CRUD**: a route workspace with form mode, textual bulk-entry mode,
  and an **AI (Gemini) mode** that drafts a route from a prompt; draft recovery; CSV
  import/template/upsert/export for bulk national data entry.
- **Permit linkage**: PSPs tie operators to route groups, so the design layer connects to who is
  licensed to run what.
- Passenger find-my-bus consumes the network correctly (stop order, directionality).

## Limitations & gaps

| Gap | Severity | Notes |
|---|---|---|
| **No route geometry** | High | Routes are stop sequences only; no polylines. Maps render straight lines between stops, distances are hand-entered rather than derived, and the (mock) tracking page can never snap vehicles to a path. Already flagged in the route-network gap list. |
| **No versioning / effective dating for routes** | High | Editing a route mutates history. A route change (new deviation, added stop) silently rewrites what past trips "ran on". Schedules have effective windows; routes don't. |
| **Unguarded deletes** | Medium | Deleting a stop used by routes 500s on a DB FK instead of a helpful 409 (known bug). |
| No *design* analysis | Medium | Nothing evaluates the network: no overlap/duplication detection between routes, no coverage measure, no transfer-point identification, no route hierarchy concept. The AI mode drafts a single route but can't reason about the network as a whole. |
| Three-tier distance columns unused | Low | `distanceFromStartKmUnverified/Calculated` are modelled, never written — either build the verification workflow or drop them (also in the route-network gap list). |
| Road type is a 2-value enum | Low | No semi-expressway, urban/rural classification, or per-segment road type. |

## Improvement candidates

1. **Route polylines** — store an encoded polyline or LineString per route; derive
   `distanceFromStartKm` (the `*Calculated` column finally gets a writer) and fix map rendering.
   Highest-leverage single item at this stage.
2. **Effective-dated route versions** — even a simple `route_version` with a validity window
   protects historical trips and enables "planned change on date X" workflows.
3. **Network health report** — a read-only analysis page: routes sharing >N consecutive stops
   (duplication), stops served by no active schedule (dead network), route groups without permits
   (unservable). All computable from existing tables; a genuine step from registry toward design.
4. **Fix delete guards** (bug #3 in the route-network gap list) before any of the above.

**Verdict: 🟢 strong national route *registry* with unusually good authoring UX; 🟡 provides no
support for *designing* or *evolving* the network — no geometry, no versioning, no analysis.**
