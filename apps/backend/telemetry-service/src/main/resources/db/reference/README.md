# db/reference — Tier 2 required reference data (telemetry-service)

Repeatable Flyway migrations (`R__NNN_*.sql`) for data that must exist in **every** environment
(prod included), not just dev demo data. Wired into `flyway.locations` in both `application.yml`
and `application-dev.yml`.

Empty in Phase 0. Phase 1 adds the device-registry reference data here — e.g. the canonical
`device_type` set (`GPS_TRACKER`, `CONDUCTOR_APP`, …) — following the same tiering as the other
services (see `docs/plans/Database-Migrations-and-Seed-Data-Plan.md` §Tiers).
