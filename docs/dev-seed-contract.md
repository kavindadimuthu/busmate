# Dev Seed Contract — Cross-Service Demo UUID Registry

Companion to [`docs/plans/Database-Migrations-and-Seed-Data-Plan.md`](plans/Database-Migrations-and-Seed-Data-Plan.md)
(§5, "Cross-service seed contract"). Read that section first for the *why*.

**Purpose:** BusMate's backend services each own an independent database, but demo/dev seed data
(Tier 3 in the plan) sometimes represents the *same* real-world entity in more than one service —
an operator is a `users` row in `user-service` and an `operator` row in `core-service`; a route in
`core-service` is referenced by fares/tickets in `ticketing-service`. Random per-service UUIDs would
never line up, so this file is the **single registry of fixed UUIDs** for any demo entity that
crosses a service boundary. Every `db/seed/dev` migration that needs one of these entities must
reference the UUID listed here — never invent one inline.

**Scope:** Dev-only demo data. Production and the required reference/bootstrap data (RBAC user
types, permissions, base fares — Tier 2 of the plan) are not affected by this registry; those live
in each service's own `db/reference` migrations and don't need cross-service IDs.

## Allocation convention

- UUIDs are hand-assigned, sequential, and namespaced by entity kind so they're recognizable in
  logs and psql output at a glance:

  | Entity kind | UUID prefix (first segment) |
  |---|---|
  | Demo operator (user) | `00000000-0000-0000-0000-0000000001xx` |
  | Demo passenger (user) | `00000000-0000-0000-0000-0000000002xx` |
  | Demo conductor (user) | `00000000-0000-0000-0000-0000000003xx` |
  | Demo route | `00000000-0000-0000-0000-0000000101xx` |
  | Demo stop | `00000000-0000-0000-0000-0000000102xx` |
  | Demo bus | `00000000-0000-0000-0000-0000000103xx` |
  | Demo schedule / trip | `00000000-0000-0000-0000-0000000104xx` |

  `xx` is a two-digit sequence number (`01`, `02`, …) within that kind, allocated in order as demo
  entities are added — never reused, never renumbered.

- **Before writing a `db/seed/dev` migration that references an entity another service also needs
  to know about, allocate its UUID here first**, in the table for that entity kind, then reference
  the same literal UUID in every service's migration.
- Entities that are purely local to one service's demo data (never referenced by another service)
  don't need an entry here — just use any UUID inline in that service's own migration.
- This registry only grows. Do not remove or reassign an entry once a migration references it —
  add a new row instead, and mark old ones `retired` if a demo entity is deleted.

## Registry

_No entries yet — this file is created in Phase 0 of the migrations/seed-data plan, ahead of
Phase 3 ("Rebuild demo seed"), which is where entries get allocated as the actual demo dataset is
authored._

### Demo operators (users)

| UUID | Name | Notes |
|---|---|---|
| _(none yet)_ | | |

### Demo passengers (users)

| UUID | Name | Notes |
|---|---|---|
| _(none yet)_ | | |

### Demo conductors (users)

| UUID | Name | Notes |
|---|---|---|

### Demo routes

| UUID | Name | Owning service | Notes |
|---|---|---|---|
| _(none yet)_ | | core-service | |

### Demo stops

| UUID | Name | Owning service | Notes |
|---|---|---|---|

### Demo buses

| UUID | Plate / label | Owning service | Notes |
|---|---|---|---|

### Demo schedules / trips

| UUID | Description | Owning service | Notes |
|---|---|---|---|
