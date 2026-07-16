-- Tier 2 reference data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3): the platform's
-- fixed set of user types. Required in every environment — User.userType is a NOT NULL FK, so
-- account creation (including the very first admin) cannot happen without these rows existing.
-- Repeatable migration, safe to re-run: upserts by the natural key (name), never deletes, so a
-- row an operator has since customized (display_name, description) via the admin API is only
-- overwritten if this file itself changes.
INSERT INTO user_types (id, name, display_name, description, is_system, is_active)
VALUES
    (gen_random_uuid(), 'admin',      'System Administrator',  'Full system access',            true, true),
    (gen_random_uuid(), 'mot',        'Ministry of Transport',  'Ministry of Transport official', true, true),
    (gen_random_uuid(), 'timekeeper', 'Timekeeper',             'Transit authority stand staff',  true, true),
    (gen_random_uuid(), 'operator',   'Fleet Operator',         'Bus service provider',           true, true),
    (gen_random_uuid(), 'conductor',  'Conductor',              'Bus crew member',                true, true),
    (gen_random_uuid(), 'passenger',  'Passenger',              'End user booking buses',         true, true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description  = EXCLUDED.description,
    is_system    = EXCLUDED.is_system,
    updated_at   = now();
