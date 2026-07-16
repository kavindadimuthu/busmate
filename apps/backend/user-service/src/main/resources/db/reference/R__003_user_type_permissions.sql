-- Tier 2 reference data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3): which
-- permissions each system user type is granted. Depends on R__001_user_types.sql and
-- R__002_permissions.sql having already run — guaranteed by Flyway, which always applies every
-- pending versioned (V) migration and then every repeatable (R) migration in filename order
-- within a single migrate operation, never interleaved.
--
-- Repeatable migration, safe to re-run: upserts on the (user_type_id, permission_id) natural key
-- added by V002__add_user_type_permissions_unique_constraint.sql. Admin-granted overrides live in
-- the separate user_permission_overrides table (see UserPermissionOverride) and are untouched by
-- this file.
INSERT INTO user_type_permissions (id, user_type_id, permission_id, is_granted)
SELECT gen_random_uuid(), ut.id, p.id, true
FROM user_types ut
CROSS JOIN permissions p
WHERE (ut.name = 'admin')
   OR (ut.name = 'passenger'  AND p.name IN ('profile:read:own', 'profile:update:own'))
   OR (ut.name = 'conductor'  AND p.name IN ('profile:read:own', 'profile:update:own',
                                              'user.passenger:read'))
   OR (ut.name = 'operator'   AND p.name IN ('profile:read:own', 'profile:update:own',
                                              'user.conductor:create', 'user.conductor:read',
                                              'user.conductor:update', 'user.conductor:delete',
                                              'user.passenger:read'))
   OR (ut.name = 'timekeeper' AND p.name IN ('profile:read:own', 'profile:update:own',
                                              'user.operator:read', 'user.conductor:read'))
   OR (ut.name = 'mot'        AND p.name IN ('profile:read:own', 'profile:update:own',
                                              'user.timekeeper:create', 'user.timekeeper:read',
                                              'user.timekeeper:update', 'user.timekeeper:delete',
                                              'user.operator:create', 'user.operator:read',
                                              'user.operator:update', 'user.operator:delete',
                                              'user.conductor:read', 'user.passenger:read'))
ON CONFLICT (user_type_id, permission_id) DO UPDATE SET
    is_granted = EXCLUDED.is_granted;
