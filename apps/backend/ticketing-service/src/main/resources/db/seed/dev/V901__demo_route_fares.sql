-- Tier 3 demo data, dev profile only. Fare-section breakdowns for two of the three demo routes
-- (Colombo-Kandy and the Colombo-Galle expressway) — enough to demonstrate the feature without
-- covering all six demo routes. route_id is a plain string column (no FK — RouteFare has no
-- reference back to core-service, matching Tickets' loose bus_id/trip_id coupling), holding the
-- actual core-service Route UUID as text, from docs/dev-seed-contract.md.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO route_fare_section (id, route_id, section_id, section_name, distance_from_start)
VALUES
    -- Colombo Fort -> Kandy (route 00000000-0000-0000-0000-000000010101)
    ('00000000-0000-0000-0000-000000020101', '00000000-0000-0000-0000-000000010101',
     1, 'Colombo Fort - Kadawatha', 12.0),
    ('00000000-0000-0000-0000-000000020102', '00000000-0000-0000-0000-000000010101',
     2, 'Kadawatha - Kegalle', 78.0),
    ('00000000-0000-0000-0000-000000020103', '00000000-0000-0000-0000-000000010101',
     3, 'Kegalle - Kandy', 115.0),

    -- Colombo Fort -> Galle expressway (route 00000000-0000-0000-0000-000000010103)
    ('00000000-0000-0000-0000-000000020104', '00000000-0000-0000-0000-000000010103',
     1, 'Colombo Fort - Kalutara', 42.0),
    ('00000000-0000-0000-0000-000000020105', '00000000-0000-0000-0000-000000010103',
     2, 'Kalutara - Ambalangoda', 85.0),
    ('00000000-0000-0000-0000-000000020106', '00000000-0000-0000-0000-000000010103',
     3, 'Ambalangoda - Galle', 119.0)
ON CONFLICT (id) DO NOTHING;
