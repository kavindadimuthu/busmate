# db/seed/dev — Tier 3 dev demo data (telemetry-service)

Repeatable Flyway migrations (`R__9NN_*.sql`) for **dev-only** demo data. Wired into
`flyway.locations` in `application-dev.yml` only (never prod/test).

Empty in Phase 0. Phase 2 adds demo devices here, assigned to the fixed demo **bus** UUIDs from
`docs/dev-seed-contract.md` (prefix `…0000000103xx`). Before writing that seed, allocate a new
**"Demo device"** UUID prefix in the seed contract's registry so the device IDs are stable and
recognizable, per `docs/plans/IoT-Platform-Layer-Plan.md` §4.
