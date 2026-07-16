-- Tier 3 demo data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3, §5) — dev profile
-- only (see application-dev.yml's flyway.locations). Illustrative distance-banded fare table,
-- loosely modeled on the NTC's real fare-section structure (a base fare per ~25km band, scaled up
-- per service class) but NOT an authoritative or current NTC fare schedule — this is dev/demo
-- data, not the Tier 2 reference data Phase 2 deliberately avoided fabricating here (see that
-- phase's as-built notes in the plan for why). base_fare has no FK to anything, so this is purely
-- illustrative content for the fare-lookup endpoints to have something to return in a fresh dev
-- environment.
--
-- Idempotent via ON CONFLICT (section) DO NOTHING (per the plan's Tier 3 guidance; `section` is
-- base_fare's own primary key) — safe to re-run.
INSERT INTO base_fare (section, normal_fare, semi_luxury_fare, luxury_fare, super_luxury_fare,
                        expressway_super_luxury_fare)
VALUES
    (1, 15.00, 20.00, 25.00, 35.00, NULL),
    (2, 35.00, 45.00, 55.00, 70.00, 90.00),
    (3, 55.00, 70.00, 85.00, 105.00, 130.00),
    (4, 75.00, 95.00, 115.00, 140.00, 170.00),
    (5, 95.00, 120.00, 145.00, 175.00, 210.00)
ON CONFLICT (section) DO NOTHING;
