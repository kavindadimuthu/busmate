-- Tier 3 demo data, dev profile only — see V900__demo_operators.sql for the scenario. Two buses
-- per operator (matching the pre-Flyway scripts/seed-operator-conductor-profiles.sh fleet size),
-- with facilities reflecting each permit class (semi-luxury/luxury/normal). seat_layout is left
-- null — Bus's own service layer derives a default 2+2 layout from capacity when absent.
-- operator_id is core-service's own operator.id (see V900), not the linked user_id. UUIDs from
-- docs/dev-seed-contract.md.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO bus (id, operator_id, ntc_registration_number, plate_number, capacity, model,
                  facilities, status, created_by)
VALUES
    ('00000000-0000-0000-0000-000000010301', '00000000-0000-0000-0000-000000010501',
     'NTC-WP-2019-04521', 'WP CAA-4521', 52, 'TATA LP 1613',
     '{"ac": true, "reclining_seats": true, "charging_ports": false, "wifi": false}'::jsonb,
     'active', 'db-seed'),

    ('00000000-0000-0000-0000-000000010302', '00000000-0000-0000-0000-000000010501',
     'NTC-WP-2020-07734', 'WP CAB-7734', 50, 'Ashok Leyland Viking',
     '{"ac": true, "reclining_seats": true, "charging_ports": false, "wifi": false}'::jsonb,
     'active', 'db-seed'),

    ('00000000-0000-0000-0000-000000010303', '00000000-0000-0000-0000-000000010502',
     'NTC-SP-2021-02210', 'SP CAA-2210', 28, 'Rosa Coaster',
     '{"ac": true, "reclining_seats": true, "charging_ports": true, "wifi": true}'::jsonb,
     'active', 'db-seed'),

    ('00000000-0000-0000-0000-000000010304', '00000000-0000-0000-0000-000000010502',
     'NTC-SP-2021-09981', 'SP CAB-9981', 45, 'Yutong ZK6122',
     '{"ac": true, "reclining_seats": true, "charging_ports": true, "wifi": true}'::jsonb,
     'active', 'db-seed'),

    ('00000000-0000-0000-0000-000000010305', '00000000-0000-0000-0000-000000010503',
     'NTC-CP-2018-01123', 'CP NA-1123', 54, 'TATA LP 1613 (SLTB)',
     '{"ac": false, "reclining_seats": false, "charging_ports": false, "wifi": false}'::jsonb,
     'active', 'db-seed'),

    ('00000000-0000-0000-0000-000000010306', '00000000-0000-0000-0000-000000010503',
     'NTC-CP-2018-01187', 'CP NA-1187', 54, 'TATA LP 1613 (SLTB)',
     '{"ac": false, "reclining_seats": false, "charging_ports": false, "wifi": false}'::jsonb,
     'active', 'db-seed')
ON CONFLICT (id) DO NOTHING;
