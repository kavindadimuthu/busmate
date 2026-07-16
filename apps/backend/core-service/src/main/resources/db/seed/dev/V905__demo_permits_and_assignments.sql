-- Tier 3 demo data, dev profile only — see V900__demo_operators.sql for the scenario. One
-- passenger service permit per operator (matching its route group and fleet class), and one
-- bus-to-permit assignment per bus. Permit numbers match the pre-Flyway
-- scripts/seed-operator-conductor-profiles.sh convention. All UUIDs here are core-service-local
-- (not in docs/dev-seed-contract.md) — nothing outside core-service references a permit or an
-- assignment directly.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO passenger_service_permit (id, operator_id, route_group_id, permit_number, issue_date,
                                       expiry_date, maximum_bus_assigned, status, permit_type,
                                       created_by)
VALUES
    ('00000000-0000-0000-0000-000000010801', '00000000-0000-0000-0000-000000010501',
     '00000000-0000-0000-0000-000000010601', 'PVT-SUW-2026-001', '2024-01-01', '2028-12-31',
     2, 'active', 'SEMI_LUXURY', 'db-seed'),

    ('00000000-0000-0000-0000-000000010802', '00000000-0000-0000-0000-000000010502',
     '00000000-0000-0000-0000-000000010602', 'PVT-SCE-2026-001', '2024-01-01', '2028-12-31',
     2, 'active', 'LUXURY', 'db-seed'),

    ('00000000-0000-0000-0000-000000010803', '00000000-0000-0000-0000-000000010503',
     '00000000-0000-0000-0000-000000010603', 'SLTB-CP-2026-001', '2024-01-01', '2028-12-31',
     2, 'active', 'NORMAL', 'db-seed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bus_passenger_service_permit_assignment (id, bus_id, passenger_service_permit_id,
                                                       start_date, status, request_status,
                                                       created_by)
VALUES
    ('00000000-0000-0000-0000-000000010901', '00000000-0000-0000-0000-000000010301',
     '00000000-0000-0000-0000-000000010801', '2024-01-15', 'active', 'ACCEPTED', 'db-seed'),
    ('00000000-0000-0000-0000-000000010902', '00000000-0000-0000-0000-000000010302',
     '00000000-0000-0000-0000-000000010801', '2024-01-15', 'active', 'ACCEPTED', 'db-seed'),

    ('00000000-0000-0000-0000-000000010903', '00000000-0000-0000-0000-000000010303',
     '00000000-0000-0000-0000-000000010802', '2024-01-15', 'active', 'ACCEPTED', 'db-seed'),
    ('00000000-0000-0000-0000-000000010904', '00000000-0000-0000-0000-000000010304',
     '00000000-0000-0000-0000-000000010802', '2024-01-15', 'active', 'ACCEPTED', 'db-seed'),

    ('00000000-0000-0000-0000-000000010905', '00000000-0000-0000-0000-000000010305',
     '00000000-0000-0000-0000-000000010803', '2024-01-15', 'active', 'ACCEPTED', 'db-seed'),
    ('00000000-0000-0000-0000-000000010906', '00000000-0000-0000-0000-000000010306',
     '00000000-0000-0000-0000-000000010803', '2024-01-15', 'active', 'ACCEPTED', 'db-seed')
ON CONFLICT (id) DO NOTHING;
