# Operator & Conductor Seed Credentials

> **⚠️ Superseded (2026-07-17) — historical reference only.** This describes the old Supabase-era
> seed script and Supabase Auth accounts. Dev accounts are now created by user-service's own Flyway
> demo seed (self-hosted auth, no script). Current login list:
> [`docs/dev-seed-credentials.md`](dev-seed-credentials.md).

Created by [`scripts/seed-operator-conductor-profiles.sh`](../scripts/seed-operator-conductor-profiles.sh) (`pnpm run seed:operators`). These are real Supabase Auth accounts on the dev project — log in through any frontend's normal login form (new-react-portal's operator dashboard, conductor-mobile, etc.) or `POST /api/auth/login` via api-gateway.

Every account here is fully aligned with the unified operator lifecycle (see [`docs/plans/Unified-Operator-Lifecycle-Management-Plan.md`](plans/Unified-Operator-Lifecycle-Management-Plan.md)): each operator's core-service `Operator` row was created through the real `/internal/operators` sync endpoint and carries a `userId` link back to its account — not raw seed SQL pretending to be linked.

Re-running the seed script deletes and recreates every account below with these exact same credentials, so this list stays accurate across resets.

## Operators

| # | Organization | Type | Region | Email | Password | Username |
|---|---|---|---|---|---|---|
| 1 | Lanka Suwaseriya Travels (Pvt) Ltd | PRIVATE | Western Province | `operator.suwaseriya@busmate.test` | `Operator1@2026` | `suwaseriya.travels` |
| 2 | Southern Comfort Express (Pvt) Ltd | PRIVATE | Southern Province | `operator.southerncomfort@busmate.test` | `Operator2@2026` | `southern.comfort` |
| 3 | Sri Lanka Transport Board – Central Province | CTB | Central Province | `operator.sltbcentral@busmate.test` | `Operator3@2026` | `sltb.central` |

Contact-person names on these accounts (the actual `fullName` field — the organization name lives in the profile): Nimal Perera, Kumari Wijesinghe, and Sunil Rathnayake, respectively.

## Conductors

| # | Name | Assigned Operator | Employee ID | NIC | Email | Password | Username |
|---|---|---|---|---|---|---|---|
| 1 | Saman Kumara | Lanka Suwaseriya Travels | `EMP-CND-1001` | `199045612345` | `conductor.saman@busmate.test` | `Conductor1@2026` | `saman.kumara` |
| 2 | Nirosha Fernando | Southern Comfort Express | `EMP-CND-1002` | `199267890123` | `conductor.nirosha@busmate.test` | `Conductor2@2026` | `nirosha.fernando` |

## What else the script seeds

Alongside the accounts above, each operator gets 2 buses and 1 passenger service permit in core-service (so the fleet/route views aren't empty):

| Operator | Buses (plate — model) | Permit |
|---|---|---|
| Suwaseriya Travels | `WP CAA-4521` — TATA LP 1613 · `WP CAB-7734` — Ashok Leyland Viking | `PVT-SUW-2026-001` (SEMI_LUXURY) |
| Southern Comfort Express | `SP CAA-2210` — Rosa Coaster · `SP CAB-9981` — Yutong ZK6122 | `PVT-SCE-2026-001` (LUXURY) |
| SLTB – Central Province | `CP NA-1123` — TATA LP 1613 (SLTB) · `CP NA-1187` — TATA LP 1613 (SLTB) | `SLTB-CP-2026-001` (NORMAL) |

## Notes

- All emails use the `@busmate.test` domain (IANA-reserved for testing, non-deliverable) — never real inboxes.
- `Sunil Rathnayake` / SLTB Central is the only `CTB`-type operator seeded; the other two are `PRIVATE`, matching the mix already used elsewhere in the app's `OPERATOR_TYPES` dropdowns.
- Passenger service permits are attached to *existing* route groups already in core-service (Colombo–Negombo, Colombo–Galle, Colombo–Kandy) — the script doesn't fabricate route/schedule data.
- No `mot`, `admin`, `timekeeper`, or `passenger` accounts are touched by this script — only `operator` and `conductor`.
