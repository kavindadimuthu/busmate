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
  | Demo IoT device | `00000000-0000-0000-0000-0000000106xx` |

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

Allocated in Phase 3 ("Rebuild demo seed") of the migrations/seed-data plan. The scenario: three
Sri Lankan bus operators, each running one route (with buses, a permit, a schedule, and a demo
conductor), plus a shared pool of demo passengers who book/ride across all three. Full detail
(fares, ticket numbers, exact times) lives in the migration files themselves — this table only
records the identifiers other services need to stay in sync.

### Demo operators (users)

The `users.user_id` and core-service `operator.id` are deliberately **different** UUIDs — in the
real unified-operator-lifecycle sync (`InternalOperatorServiceImpl.createOrGetOperator`),
`Operator.id` is a fresh `UUID.randomUUID()`, never the linked `userId`. Reusing the same value
for both would misrepresent that relationship, so each operator gets two entries here.

| `users.user_id` | core-service `operator.id` | Name | Notes |
|---|---|---|---|
| `00000000-0000-0000-0000-000000000101` | `00000000-0000-0000-0000-000000010501` | Nimal Perera | Lanka Suwaseriya Travels (Pvt) Ltd — PRIVATE, Western Province. Runs the Colombo–Kandy line. |
| `00000000-0000-0000-0000-000000000102` | `00000000-0000-0000-0000-000000010502` | Kumari Wijesinghe | Southern Comfort Express (Pvt) Ltd — PRIVATE, Southern Province. Runs the Colombo–Galle expressway line. |
| `00000000-0000-0000-0000-000000000103` | `00000000-0000-0000-0000-000000010503` | Sunil Rathnayake | Sri Lanka Transport Board – Central Province — CTB, Central Province. Runs the Colombo–Negombo line. |

### Demo passengers (users)

| UUID | Name | Notes |
|---|---|---|
| `00000000-0000-0000-0000-000000000201` | Dilani Perera | Books an online ticket on the Colombo–Kandy line. |
| `00000000-0000-0000-0000-000000000202` | Kasun Mendis | Books an online ticket on the Colombo–Galle line. |
| `00000000-0000-0000-0000-000000000203` | Ishara Gunawardena | Books an online ticket on the Colombo–Negombo line. |

### Demo conductors (users)

| UUID | Name | Notes |
|---|---|---|
| `00000000-0000-0000-0000-000000000301` | Saman Kumara | Assigned to Lanka Suwaseriya Travels (Colombo–Kandy). |
| `00000000-0000-0000-0000-000000000302` | Nirosha Fernando | Assigned to Southern Comfort Express (Colombo–Galle). |
| `00000000-0000-0000-0000-000000000303` | Ranjith Silva | Assigned to SLTB – Central Province (Colombo–Negombo). |

### Demo routes

| UUID | Name | Owning service | Notes |
|---|---|---|---|
| `00000000-0000-0000-0000-000000010101` | Colombo Fort → Kandy | core-service | OUTBOUND, NORMALWAY, route group "Colombo - Kandy". |
| `00000000-0000-0000-0000-000000010102` | Kandy → Colombo Fort | core-service | INBOUND counterpart of the above. |
| `00000000-0000-0000-0000-000000010103` | Colombo Fort → Galle | core-service | OUTBOUND, EXPRESSWAY (Southern Expressway), route group "Colombo - Galle". |
| `00000000-0000-0000-0000-000000010104` | Galle → Colombo Fort | core-service | INBOUND counterpart of the above. |
| `00000000-0000-0000-0000-000000010105` | Colombo Fort → Negombo | core-service | OUTBOUND, NORMALWAY, route group "Colombo - Negombo". |
| `00000000-0000-0000-0000-000000010106` | Negombo → Colombo Fort | core-service | INBOUND counterpart of the above. |

### Demo stops

| UUID | Name | Owning service | Notes |
|---|---|---|---|
| `00000000-0000-0000-0000-000000010201` | Colombo Fort (Central Bus Stand) | core-service | Shared origin/terminus for all three lines. |
| `00000000-0000-0000-0000-000000010202` | Kadawatha | core-service | Colombo–Kandy intermediate stop. |
| `00000000-0000-0000-0000-000000010203` | Kegalle | core-service | Colombo–Kandy intermediate stop. |
| `00000000-0000-0000-0000-000000010204` | Kandy (Goods Shed Bus Stand) | core-service | Colombo–Kandy terminus. |
| `00000000-0000-0000-0000-000000010205` | Kalutara | core-service | Colombo–Galle intermediate stop. |
| `00000000-0000-0000-0000-000000010206` | Ambalangoda | core-service | Colombo–Galle intermediate stop. |
| `00000000-0000-0000-0000-000000010207` | Galle (Bus Stand) | core-service | Colombo–Galle terminus. |
| `00000000-0000-0000-0000-000000010208` | Wattala | core-service | Colombo–Negombo intermediate stop. |
| `00000000-0000-0000-0000-000000010209` | Negombo (Bus Stand) | core-service | Colombo–Negombo terminus. |

### Demo buses

| UUID | Plate / label | Owning service | Notes |
|---|---|---|---|
| `00000000-0000-0000-0000-000000010301` | WP CAA-4521 — TATA LP 1613 | core-service | Lanka Suwaseriya Travels. |
| `00000000-0000-0000-0000-000000010302` | WP CAB-7734 — Ashok Leyland Viking | core-service | Lanka Suwaseriya Travels. |
| `00000000-0000-0000-0000-000000010303` | SP CAA-2210 — Rosa Coaster | core-service | Southern Comfort Express. |
| `00000000-0000-0000-0000-000000010304` | SP CAB-9981 — Yutong ZK6122 | core-service | Southern Comfort Express. |
| `00000000-0000-0000-0000-000000010305` | CP NA-1123 — TATA LP 1613 (SLTB) | core-service | SLTB – Central Province. |
| `00000000-0000-0000-0000-000000010306` | CP NA-1187 — TATA LP 1613 (SLTB) | core-service | SLTB – Central Province. |

### Demo schedules / trips

| UUID | Description | Owning service | Notes |
|---|---|---|---|
| `00000000-0000-0000-0000-000000010401` | Schedule: Colombo–Kandy Morning Express | core-service | Daily, route `...010101`. |
| `00000000-0000-0000-0000-000000010402` | Schedule: Kandy–Colombo Afternoon Express | core-service | Daily, route `...010102`. |
| `00000000-0000-0000-0000-000000010403` | Schedule: Colombo–Galle Expressway Luxury | core-service | Daily, route `...010103`. |
| `00000000-0000-0000-0000-000000010404` | Schedule: Galle–Colombo Expressway Luxury | core-service | Daily, route `...010104`. |
| `00000000-0000-0000-0000-000000010405` | Schedule: Colombo–Negombo Local | core-service | Daily, route `...010105`. |
| `00000000-0000-0000-0000-000000010406` | Schedule: Negombo–Colombo Local | core-service | Daily, route `...010106`. |
| `00000000-0000-0000-0000-000000010407` | Trip: Colombo–Kandy, today | core-service | The specific trip ticketing-service's demo tickets A/B reference (as text, no FK). |
| `00000000-0000-0000-0000-000000010408` | Trip: Colombo–Galle, today | core-service | Referenced by demo tickets C/D. |
| `00000000-0000-0000-0000-000000010409` | Trip: Colombo–Negombo, today | core-service | Referenced by demo tickets E/F. |

### Demo IoT devices

Allocated in Phase 1 ("Device registry") of the IoT Platform Layer plan
([`docs/plans/IoT-Platform-Layer-Plan.md`](plans/IoT-Platform-Layer-Plan.md) §4). One GPS tracker
per demo bus, assigned 1:1. `device.id` is telemetry-service's own primary key (not referenced
elsewhere), listed here only so the pairing with the demo bus is stable across re-seeds.

| UUID | Serial / label | Owning service | Assigned to bus |
|---|---|---|---|
| `00000000-0000-0000-0000-000000010601` | GPS-DEMO-4521 — WP CAA-4521 dashboard tracker | telemetry-service | `...010301` |
| `00000000-0000-0000-0000-000000010602` | GPS-DEMO-7734 — WP CAB-7734 dashboard tracker | telemetry-service | `...010302` |
| `00000000-0000-0000-0000-000000010603` | GPS-DEMO-2210 — SP CAA-2210 dashboard tracker | telemetry-service | `...010303` |
| `00000000-0000-0000-0000-000000010604` | GPS-DEMO-9981 — SP CAB-9981 dashboard tracker | telemetry-service | `...010304` |
| `00000000-0000-0000-0000-000000010605` | GPS-DEMO-1123 — CP NA-1123 dashboard tracker | telemetry-service | `...010305` |
| `00000000-0000-0000-0000-000000010606` | GPS-DEMO-1187 — CP NA-1187 dashboard tracker | telemetry-service | `...010306` |
| `00000000-0000-0000-0000-000000010607` | CONDUCTOR-APP-DEMO-001 — conductor-mobile's own GPS reporting | telemetry-service | None (resolves bus from the tripId it reports, not a static assignment — see IoT Platform Layer plan §Phase 2 enrichment). |
| `00000000-0000-0000-0000-000000010608` | MQTT-CONSUMER-INTERNAL — telemetry-service's own MQTT subscriber (Phase 4) | telemetry-service | None — not a fleet device; authenticates to EMQX through the same device-credential mechanism as any tracker (see `config/mqtt/emqx.conf`). |
