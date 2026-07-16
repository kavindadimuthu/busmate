-- Tier 2 reference data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3): the platform's
-- fixed permission catalog, cross-checked against every @RequiresPermission("...") string actually
-- used in the controllers (UserTypesController, PermissionsController,
-- UserPermissionOverridesController) so this list is exactly what the code enforces, not a guess.
-- Repeatable migration, safe to re-run: upserts by the natural key (name). `permissions` has no
-- updated_at column (see V001__baseline.sql), so there is nothing to bump on conflict beyond the
-- descriptive columns.
INSERT INTO permissions (id, name, resource, action, scope, description)
VALUES
    (gen_random_uuid(), 'profile:read:own',       'profile',         'read',   'own', 'Read own profile'),
    (gen_random_uuid(), 'profile:update:own',     'profile',         'update', 'own', 'Update own profile'),

    (gen_random_uuid(), 'user.admin:create',      'user.admin',      'create', 'any', 'Create admin user'),
    (gen_random_uuid(), 'user.admin:read',        'user.admin',      'read',   'any', 'Read admin user'),
    (gen_random_uuid(), 'user.admin:update',      'user.admin',      'update', 'any', 'Update admin user'),
    (gen_random_uuid(), 'user.admin:delete',      'user.admin',      'delete', 'any', 'Delete admin user'),

    (gen_random_uuid(), 'user.mot:create',        'user.mot',        'create', 'any', 'Create MOT user'),
    (gen_random_uuid(), 'user.mot:read',          'user.mot',        'read',   'any', 'Read MOT user'),
    (gen_random_uuid(), 'user.mot:update',        'user.mot',        'update', 'any', 'Update MOT user'),
    (gen_random_uuid(), 'user.mot:delete',        'user.mot',        'delete', 'any', 'Delete MOT user'),

    (gen_random_uuid(), 'user.timekeeper:create', 'user.timekeeper', 'create', 'any', 'Create timekeeper'),
    (gen_random_uuid(), 'user.timekeeper:read',   'user.timekeeper', 'read',   'any', 'Read timekeeper'),
    (gen_random_uuid(), 'user.timekeeper:update', 'user.timekeeper', 'update', 'any', 'Update timekeeper'),
    (gen_random_uuid(), 'user.timekeeper:delete', 'user.timekeeper', 'delete', 'any', 'Delete timekeeper'),

    (gen_random_uuid(), 'user.operator:create',   'user.operator',   'create', 'any', 'Create operator'),
    (gen_random_uuid(), 'user.operator:read',     'user.operator',   'read',   'any', 'Read operator'),
    (gen_random_uuid(), 'user.operator:update',   'user.operator',   'update', 'any', 'Update operator'),
    (gen_random_uuid(), 'user.operator:delete',   'user.operator',   'delete', 'any', 'Delete operator'),

    (gen_random_uuid(), 'user.conductor:create',  'user.conductor',  'create', 'any', 'Create conductor'),
    (gen_random_uuid(), 'user.conductor:read',    'user.conductor',  'read',   'any', 'Read conductor'),
    (gen_random_uuid(), 'user.conductor:update',  'user.conductor',  'update', 'any', 'Update conductor'),
    (gen_random_uuid(), 'user.conductor:delete',  'user.conductor',  'delete', 'any', 'Delete conductor'),

    (gen_random_uuid(), 'user.passenger:create',  'user.passenger',  'create', 'any', 'Create passenger'),
    (gen_random_uuid(), 'user.passenger:read',    'user.passenger',  'read',   'any', 'Read passenger'),
    (gen_random_uuid(), 'user.passenger:update',  'user.passenger',  'update', 'any', 'Update passenger'),
    (gen_random_uuid(), 'user.passenger:delete',  'user.passenger',  'delete', 'any', 'Delete passenger'),

    (gen_random_uuid(), 'user-type:manage',       'user-type',       'manage', 'any', 'Manage user types'),
    (gen_random_uuid(), 'permission:manage',      'permission',      'manage', 'any', 'Manage permissions')
ON CONFLICT (name) DO UPDATE SET
    resource    = EXCLUDED.resource,
    action      = EXCLUDED.action,
    scope       = EXCLUDED.scope,
    description = EXCLUDED.description;
