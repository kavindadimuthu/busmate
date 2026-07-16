-- Tier 3 demo data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3, §5) — dev profile
-- only (see application-dev.yml's flyway.locations). A small, coherent Sri Lankan bus-transport
-- scenario: three private/CTB operators each running one route, their conductors, a handful of
-- passengers, plus the admin/MOT/timekeeper accounts needed to exercise every RBAC role from
-- Phase 2. UUIDs are the fixed ones registered in docs/dev-seed-contract.md so core-service's and
-- ticketing-service's own dev seed can reference the same operators/conductors/passengers.
--
-- Idempotent via ON CONFLICT DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run, but a
-- re-run will NOT pick up edits to a row already inserted (unlike Tier 2's DO UPDATE). Reset the
-- dev database if you change this file and need existing rows refreshed.
--
-- Named R__ (repeatable), not V900__ (versioned) like core-service/ticketing-service's demo
-- seed: Flyway always applies every pending *versioned* migration across every configured
-- location before any *repeatable* one, regardless of version number — so a versioned V900 here
-- would run before R__001_user_types.sql populates the user_types this file's user_type_id
-- subqueries depend on (confirmed the hard way: "null value in column user_type_id violates
-- not-null constraint" against a genuinely empty database). Repeatable, sorted by filename after
-- R__001-003, is what actually guarantees Tier 2 exists first. This only matters for a service
-- that has *both* a reference tier and a seed tier — core-service and ticketing-service have no
-- db/reference, so their V900+ files never hit this hazard.
INSERT INTO users (user_id, email, full_name, username, phone_number, user_type_id,
                    account_status, is_email_verified, created_by)
VALUES
    -- Platform staff
    ('00000000-0000-0000-0000-000000000401', 'admin@busmate.test', 'Ravindu Jayasuriya',
     'ravindu.jayasuriya', '+94711234501',
     (SELECT id FROM user_types WHERE name = 'admin'), 'active', true, NULL),

    ('00000000-0000-0000-0000-000000000402', 'mot@busmate.test', 'Chaminda Wickramasinghe',
     'chaminda.wickramasinghe', '+94711234502',
     (SELECT id FROM user_types WHERE name = 'mot'), 'active', true,
     '00000000-0000-0000-0000-000000000401'),

    ('00000000-0000-0000-0000-000000000403', 'timekeeper@busmate.test', 'Priyantha Bandara',
     'priyantha.bandara', '+94711234503',
     (SELECT id FROM user_types WHERE name = 'timekeeper'), 'active', true,
     '00000000-0000-0000-0000-000000000401'),

    -- Operators (contact person on the account; the organization itself lives in the profile —
    -- see R__902_demo_user_profiles.sql). Same three operators core-service's seed links by this
    -- exact user_id via Operator.userId.
    ('00000000-0000-0000-0000-000000000101', 'operator.suwaseriya@busmate.test', 'Nimal Perera',
     'suwaseriya.travels', '+94711234504',
     (SELECT id FROM user_types WHERE name = 'operator'), 'active', true,
     '00000000-0000-0000-0000-000000000401'),

    ('00000000-0000-0000-0000-000000000102', 'operator.southerncomfort@busmate.test', 'Kumari Wijesinghe',
     'southern.comfort', '+94711234505',
     (SELECT id FROM user_types WHERE name = 'operator'), 'active', true,
     '00000000-0000-0000-0000-000000000401'),

    ('00000000-0000-0000-0000-000000000103', 'operator.sltbcentral@busmate.test', 'Sunil Rathnayake',
     'sltb.central', '+94711234506',
     (SELECT id FROM user_types WHERE name = 'operator'), 'active', true,
     '00000000-0000-0000-0000-000000000401'),

    -- Conductors, each created by (and assigned to) their operator — mirrors the real
    -- user.conductor:create permission an operator account actually holds (see Phase 2's
    -- R__003_user_type_permissions.sql).
    ('00000000-0000-0000-0000-000000000301', 'conductor.saman@busmate.test', 'Saman Kumara',
     'saman.kumara', '+94711234507',
     (SELECT id FROM user_types WHERE name = 'conductor'), 'active', true,
     '00000000-0000-0000-0000-000000000101'),

    ('00000000-0000-0000-0000-000000000302', 'conductor.nirosha@busmate.test', 'Nirosha Fernando',
     'nirosha.fernando', '+94711234508',
     (SELECT id FROM user_types WHERE name = 'conductor'), 'active', true,
     '00000000-0000-0000-0000-000000000102'),

    ('00000000-0000-0000-0000-000000000303', 'conductor.ranjith@busmate.test', 'Ranjith Silva',
     'ranjith.silva', '+94711234509',
     (SELECT id FROM user_types WHERE name = 'conductor'), 'active', true,
     '00000000-0000-0000-0000-000000000103'),

    -- Passengers, self-registered (no created_by) — one per demo route so each line has a
    -- passenger who's actually booked a ticket on it (see ticketing-service's dev seed).
    ('00000000-0000-0000-0000-000000000201', 'passenger.dilani@busmate.test', 'Dilani Perera',
     'dilani.perera', '+94711234510',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL),

    ('00000000-0000-0000-0000-000000000202', 'passenger.kasun@busmate.test', 'Kasun Mendis',
     'kasun.mendis', '+94711234511',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL),

    ('00000000-0000-0000-0000-000000000203', 'passenger.ishara@busmate.test', 'Ishara Gunawardena',
     'ishara.gunawardena', '+94711234512',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL)
ON CONFLICT (user_id) DO NOTHING;
