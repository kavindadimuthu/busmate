-- Tier 3 demo data, dev profile only — see R__900_demo_devices.sql for the scenario. Each demo
-- tracker is assigned to its matching demo bus (core-service's V904__demo_buses.sql) — 1:1, no
-- cross-database FK (bus_id is a soft reference, per IoT Platform Layer plan §4).
--
-- Repeatable (R__), same Tier 2/Tier 3 ordering hazard as R__900 — see that file's header.
-- Idempotent via ON CONFLICT (id) DO NOTHING.
INSERT INTO device_assignment (id, device_id, bus_id, created_by)
VALUES
    ('00000000-0000-0000-0000-000000010621', '00000000-0000-0000-0000-000000010601',
     '00000000-0000-0000-0000-000000010301', 'db-seed'),
    ('00000000-0000-0000-0000-000000010622', '00000000-0000-0000-0000-000000010602',
     '00000000-0000-0000-0000-000000010302', 'db-seed'),
    ('00000000-0000-0000-0000-000000010623', '00000000-0000-0000-0000-000000010603',
     '00000000-0000-0000-0000-000000010303', 'db-seed'),
    ('00000000-0000-0000-0000-000000010624', '00000000-0000-0000-0000-000000010604',
     '00000000-0000-0000-0000-000000010304', 'db-seed'),
    ('00000000-0000-0000-0000-000000010625', '00000000-0000-0000-0000-000000010605',
     '00000000-0000-0000-0000-000000010305', 'db-seed'),
    ('00000000-0000-0000-0000-000000010626', '00000000-0000-0000-0000-000000010606',
     '00000000-0000-0000-0000-000000010306', 'db-seed')
ON CONFLICT (id) DO NOTHING;
