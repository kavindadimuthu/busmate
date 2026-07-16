# Dev Seed Login Credentials

Successor to [`operator-conductor-seed-credentials.md`](operator-conductor-seed-credentials.md)
(kept for history; that one describes the pre-Flyway, Supabase-era seed script). These accounts
are created by user-service's own Flyway dev seed —
[`R__900_demo_users.sql`](../apps/backend/user-service/src/main/resources/db/seed/dev/R__900_demo_users.sql)
and its two companion files — which runs automatically every time user-service starts against a
local dev database (`SPRING_PROFILES_ACTIVE=dev`, the default). No script to run, no reset
procedure beyond the normal `docker compose down -v && docker compose up`: log in through any
frontend's login form, or `POST /api/auth/login` directly, as soon as the stack is up.

Every password hash in that migration is real bcrypt — these credentials work for an actual
login, not just a database row. See
[`docs/dev-seed-contract.md`](dev-seed-contract.md) for the fixed UUIDs behind each account (used
by core-service's and ticketing-service's own dev seed to stay in sync), and
[`docs/plans/Database-Migrations-and-Seed-Data-Plan.md`](plans/Database-Migrations-and-Seed-Data-Plan.md)
(Phase 3) for how this dataset was built.

All emails use the `@busmate.test` domain (IANA-reserved for testing, non-deliverable) — never
real inboxes. Password convention: `{Role}{N}@2026`.

## Platform staff

| Role | Name | Email | Password |
|---|---|---|---|
| Admin | Ravindu Jayasuriya | `admin@busmate.test` | `Admin@2026` |
| MOT | Chaminda Wickramasinghe | `mot@busmate.test` | `Mot@2026` |
| Timekeeper | Priyantha Bandara | `timekeeper@busmate.test` | `Timekeeper@2026` |

## Operators

| Organization | Type | Region | Contact | Email | Password |
|---|---|---|---|---|---|
| Lanka Suwaseriya Travels (Pvt) Ltd | PRIVATE | Western Province | Nimal Perera | `operator.suwaseriya@busmate.test` | `Operator1@2026` |
| Southern Comfort Express (Pvt) Ltd | PRIVATE | Southern Province | Kumari Wijesinghe | `operator.southerncomfort@busmate.test` | `Operator2@2026` |
| Sri Lanka Transport Board – Central Province | CTB | Central Province | Sunil Rathnayake | `operator.sltbcentral@busmate.test` | `Operator3@2026` |

## Conductors

| Name | Assigned Operator | Email | Password |
|---|---|---|---|
| Saman Kumara | Lanka Suwaseriya Travels | `conductor.saman@busmate.test` | `Conductor1@2026` |
| Nirosha Fernando | Southern Comfort Express | `conductor.nirosha@busmate.test` | `Conductor2@2026` |
| Ranjith Silva | SLTB – Central Province | `conductor.ranjith@busmate.test` | `Conductor3@2026` |

## Passengers

| Name | Email | Password |
|---|---|---|
| Dilani Perera | `passenger.dilani@busmate.test` | `Passenger1@2026` |
| Kasun Mendis | `passenger.kasun@busmate.test` | `Passenger2@2026` |
| Ishara Gunawardena | `passenger.ishara@busmate.test` | `Passenger3@2026` |

## What else the dev seed creates

Beyond the accounts above, a fresh dev stack (all three services, `SPRING_PROFILES_ACTIVE=dev`)
comes up with a small, coherent Sri Lankan bus-transport scenario:

| Operator | Route | Buses | Permit |
|---|---|---|---|
| Lanka Suwaseriya Travels | Colombo Fort ↔ Kandy (normal road) | `WP CAA-4521` — TATA LP 1613 · `WP CAB-7734` — Ashok Leyland Viking | `PVT-SUW-2026-001` (SEMI_LUXURY) |
| Southern Comfort Express | Colombo Fort ↔ Galle (Southern Expressway) | `SP CAA-2210` — Rosa Coaster · `SP CAB-9981` — Yutong ZK6122 | `PVT-SCE-2026-001` (LUXURY) |
| SLTB – Central Province | Colombo Fort ↔ Negombo (normal road) | `CP NA-1123` — TATA LP 1613 (SLTB) · `CP NA-1187` — TATA LP 1613 (SLTB) | `SLTB-CP-2026-001` (NORMAL) |

Each route runs a daily schedule with realistic timetabled stops (9 real Sri Lankan bus stops in
total — Colombo Fort, Kadawatha, Kegalle, Kandy, Kalutara, Ambalangoda, Galle, Wattala, Negombo)
and two trips: one from **yesterday** (`completed`) and one from **today** (`pending`) — the trip
dates are relative to `CURRENT_DATE`, so this stays true no matter when the database was last
freshly seeded. ticketing-service adds a demo fare table and six tickets (one cash + one online
per route) against today's trips, so there's real data to browse in every service on first boot —
no separate seed script, no manual setup.

## Notes

- Re-running the app (restart, redeploy) does **not** duplicate or reset these rows — the seed
  migrations are idempotent (`ON CONFLICT DO NOTHING`). To get a truly fresh copy of this data,
  drop the database (or `docker compose down -v`) and start again.
- These are dev-profile-only migrations (`db/seed/dev` in each service, wired into
  `application-dev.yml`'s `spring.flyway.locations`) — none of this ever runs against production.
