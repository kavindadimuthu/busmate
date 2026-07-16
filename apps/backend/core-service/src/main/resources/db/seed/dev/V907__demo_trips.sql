-- Tier 3 demo data, dev profile only — see V900__demo_operators.sql for the scenario. Two trips
-- per route (yesterday, completed; today, pending) so the dev environment always has both
-- operational history and an upcoming trip to browse, regardless of when the database was last
-- seeded — trip_date uses CURRENT_DATE rather than a fixed date for exactly that reason. Each
-- route's trips use its operator's own bus (alternating between the two) and conductor.
--
-- Three of today's trips (Colombo-Kandy, Colombo-Galle, Colombo-Negombo outbound) use the shared
-- UUIDs from docs/dev-seed-contract.md, because ticketing-service's dev seed references them (as
-- text — Tickets.tripId/Bus columns are loosely-coupled strings, not real FKs, matching the
-- pattern already used for busId there). The other nine trips are core-service-local.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
-- Note: trip_date is CURRENT_DATE-relative, so re-running this migration on a *different* day
-- than its first run will not move yesterday's/today's rows — by design (ON CONFLICT DO NOTHING
-- never updates), the dev database only reflects "today" as of whenever it was last freshly
-- seeded (e.g. after a docker compose down -v), not on every restart.
INSERT INTO trip (id, schedule_id, passenger_service_permit_id, bus_id, conductor_id, trip_date,
                   scheduled_departure_time, actual_departure_time, scheduled_arrival_time,
                   actual_arrival_time, status, created_by)
VALUES
    -- Route 101 (Colombo -> Kandy): Suwaseriya, conductor Saman Kumara
    ('00000000-0000-0000-0000-000000011201', '00000000-0000-0000-0000-000000010401',
     '00000000-0000-0000-0000-000000010801', '00000000-0000-0000-0000-000000010301',
     '00000000-0000-0000-0000-000000000301', CURRENT_DATE - 1, '06:00', '06:00', '09:45', '09:52',
     'completed', 'db-seed'),
    ('00000000-0000-0000-0000-000000010407', '00000000-0000-0000-0000-000000010401',
     '00000000-0000-0000-0000-000000010801', '00000000-0000-0000-0000-000000010302',
     '00000000-0000-0000-0000-000000000301', CURRENT_DATE, '06:00', NULL, '09:45', NULL,
     'pending', 'db-seed'),

    -- Route 102 (Kandy -> Colombo): Suwaseriya, conductor Saman Kumara
    ('00000000-0000-0000-0000-000000011202', '00000000-0000-0000-0000-000000010402',
     '00000000-0000-0000-0000-000000010801', '00000000-0000-0000-0000-000000010302',
     '00000000-0000-0000-0000-000000000301', CURRENT_DATE - 1, '14:00', '14:05', '17:45', '17:50',
     'completed', 'db-seed'),
    ('00000000-0000-0000-0000-000000011203', '00000000-0000-0000-0000-000000010402',
     '00000000-0000-0000-0000-000000010801', '00000000-0000-0000-0000-000000010301',
     '00000000-0000-0000-0000-000000000301', CURRENT_DATE, '14:00', NULL, '17:45', NULL,
     'pending', 'db-seed'),

    -- Route 103 (Colombo -> Galle): Southern Comfort, conductor Nirosha Fernando
    ('00000000-0000-0000-0000-000000011204', '00000000-0000-0000-0000-000000010403',
     '00000000-0000-0000-0000-000000010802', '00000000-0000-0000-0000-000000010303',
     '00000000-0000-0000-0000-000000000302', CURRENT_DATE - 1, '07:00', '07:02', '08:45', '08:50',
     'completed', 'db-seed'),
    ('00000000-0000-0000-0000-000000010408', '00000000-0000-0000-0000-000000010403',
     '00000000-0000-0000-0000-000000010802', '00000000-0000-0000-0000-000000010304',
     '00000000-0000-0000-0000-000000000302', CURRENT_DATE, '07:00', NULL, '08:45', NULL,
     'pending', 'db-seed'),

    -- Route 104 (Galle -> Colombo): Southern Comfort, conductor Nirosha Fernando
    ('00000000-0000-0000-0000-000000011205', '00000000-0000-0000-0000-000000010404',
     '00000000-0000-0000-0000-000000010802', '00000000-0000-0000-0000-000000010304',
     '00000000-0000-0000-0000-000000000302', CURRENT_DATE - 1, '16:00', '16:03', '17:45', '17:48',
     'completed', 'db-seed'),
    ('00000000-0000-0000-0000-000000011206', '00000000-0000-0000-0000-000000010404',
     '00000000-0000-0000-0000-000000010802', '00000000-0000-0000-0000-000000010303',
     '00000000-0000-0000-0000-000000000302', CURRENT_DATE, '16:00', NULL, '17:45', NULL,
     'pending', 'db-seed'),

    -- Route 105 (Colombo -> Negombo): SLTB Central, conductor Ranjith Silva
    ('00000000-0000-0000-0000-000000011207', '00000000-0000-0000-0000-000000010405',
     '00000000-0000-0000-0000-000000010803', '00000000-0000-0000-0000-000000010305',
     '00000000-0000-0000-0000-000000000303', CURRENT_DATE - 1, '09:00', '09:01', '09:55', '09:58',
     'completed', 'db-seed'),
    ('00000000-0000-0000-0000-000000010409', '00000000-0000-0000-0000-000000010405',
     '00000000-0000-0000-0000-000000010803', '00000000-0000-0000-0000-000000010306',
     '00000000-0000-0000-0000-000000000303', CURRENT_DATE, '09:00', NULL, '09:55', NULL,
     'pending', 'db-seed'),

    -- Route 106 (Negombo -> Colombo): SLTB Central, conductor Ranjith Silva
    ('00000000-0000-0000-0000-000000011208', '00000000-0000-0000-0000-000000010406',
     '00000000-0000-0000-0000-000000010803', '00000000-0000-0000-0000-000000010306',
     '00000000-0000-0000-0000-000000000303', CURRENT_DATE - 1, '17:00', '17:04', '17:55', '17:59',
     'completed', 'db-seed'),
    ('00000000-0000-0000-0000-000000011209', '00000000-0000-0000-0000-000000010406',
     '00000000-0000-0000-0000-000000010803', '00000000-0000-0000-0000-000000010305',
     '00000000-0000-0000-0000-000000000303', CURRENT_DATE, '17:00', NULL, '17:55', NULL,
     'pending', 'db-seed')
ON CONFLICT (id) DO NOTHING;
