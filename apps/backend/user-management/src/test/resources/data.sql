-- Mirrors Phase 2's real Supabase migrations 001/004/005 exactly, so PermissionMatrixTest
-- verifies against the same seed data the live project actually has.

INSERT INTO user_types (id, name, display_name, description, is_system, is_active) VALUES
    (RANDOM_UUID(), 'admin',       'System Administrator', 'Full system access', true, true),
    (RANDOM_UUID(), 'mot',         'Ministry of Transport', 'Ministry of Transport official', true, true),
    (RANDOM_UUID(), 'timekeeper',  'Timekeeper', 'Transit authority stand staff', true, true),
    (RANDOM_UUID(), 'operator',    'Fleet Operator', 'Bus service provider', true, true),
    (RANDOM_UUID(), 'conductor',   'Conductor', 'Bus crew member', true, true),
    (RANDOM_UUID(), 'passenger',   'Passenger', 'End user booking buses', true, true);

INSERT INTO permissions (id, name, resource, action, scope, description) VALUES
    (RANDOM_UUID(), 'profile:read:own',          'profile',         'read',   'own', 'Read own profile'),
    (RANDOM_UUID(), 'profile:update:own',        'profile',         'update', 'own', 'Update own profile'),
    (RANDOM_UUID(), 'user.admin:create',         'user.admin',      'create', 'any', 'Create admin user'),
    (RANDOM_UUID(), 'user.admin:read',           'user.admin',      'read',   'any', 'Read admin user'),
    (RANDOM_UUID(), 'user.admin:update',         'user.admin',      'update', 'any', 'Update admin user'),
    (RANDOM_UUID(), 'user.admin:delete',         'user.admin',      'delete', 'any', 'Delete admin user'),
    (RANDOM_UUID(), 'user.mot:create',           'user.mot',        'create', 'any', 'Create MOT user'),
    (RANDOM_UUID(), 'user.mot:read',             'user.mot',        'read',   'any', 'Read MOT user'),
    (RANDOM_UUID(), 'user.mot:update',           'user.mot',        'update', 'any', 'Update MOT user'),
    (RANDOM_UUID(), 'user.mot:delete',           'user.mot',        'delete', 'any', 'Delete MOT user'),
    (RANDOM_UUID(), 'user.timekeeper:create',    'user.timekeeper', 'create', 'any', 'Create timekeeper'),
    (RANDOM_UUID(), 'user.timekeeper:read',      'user.timekeeper', 'read',   'any', 'Read timekeeper'),
    (RANDOM_UUID(), 'user.timekeeper:update',    'user.timekeeper', 'update', 'any', 'Update timekeeper'),
    (RANDOM_UUID(), 'user.timekeeper:delete',    'user.timekeeper', 'delete', 'any', 'Delete timekeeper'),
    (RANDOM_UUID(), 'user.operator:create',      'user.operator',   'create', 'any', 'Create operator'),
    (RANDOM_UUID(), 'user.operator:read',        'user.operator',   'read',   'any', 'Read operator'),
    (RANDOM_UUID(), 'user.operator:update',      'user.operator',   'update', 'any', 'Update operator'),
    (RANDOM_UUID(), 'user.operator:delete',      'user.operator',   'delete', 'any', 'Delete operator'),
    (RANDOM_UUID(), 'user.conductor:create',     'user.conductor',  'create', 'any', 'Create conductor'),
    (RANDOM_UUID(), 'user.conductor:read',       'user.conductor',  'read',   'any', 'Read conductor'),
    (RANDOM_UUID(), 'user.conductor:update',     'user.conductor',  'update', 'any', 'Update conductor'),
    (RANDOM_UUID(), 'user.conductor:delete',     'user.conductor',  'delete', 'any', 'Delete conductor'),
    (RANDOM_UUID(), 'user.passenger:create',     'user.passenger',  'create', 'any', 'Create passenger'),
    (RANDOM_UUID(), 'user.passenger:read',       'user.passenger',  'read',   'any', 'Read passenger'),
    (RANDOM_UUID(), 'user.passenger:update',     'user.passenger',  'update', 'any', 'Update passenger'),
    (RANDOM_UUID(), 'user.passenger:delete',     'user.passenger',  'delete', 'any', 'Delete passenger'),
    (RANDOM_UUID(), 'user-type:manage',          'user-type',       'manage', 'any', 'Manage user types'),
    (RANDOM_UUID(), 'permission:manage',         'permission',      'manage', 'any', 'Manage permissions');

INSERT INTO user_type_permissions (id, user_type_id, permission_id, is_granted)
SELECT RANDOM_UUID(), ut.id, p.id, true FROM user_types ut, permissions p
WHERE (ut.name = 'admin')
   OR (ut.name = 'passenger'      AND p.name IN ('profile:read:own','profile:update:own'))
   OR (ut.name = 'conductor'      AND p.name IN ('profile:read:own','profile:update:own','user.passenger:read'))
   OR (ut.name = 'operator'       AND p.name IN ('profile:read:own','profile:update:own',
                                                   'user.conductor:create','user.conductor:read',
                                                   'user.conductor:update','user.conductor:delete',
                                                   'user.passenger:read'))
   OR (ut.name = 'timekeeper'     AND p.name IN ('profile:read:own','profile:update:own',
                                                   'user.operator:read','user.conductor:read'))
   OR (ut.name = 'mot'            AND p.name IN ('profile:read:own','profile:update:own',
                                                   'user.timekeeper:create','user.timekeeper:read',
                                                   'user.timekeeper:update','user.timekeeper:delete',
                                                   'user.operator:create','user.operator:read',
                                                   'user.operator:update','user.operator:delete',
                                                   'user.conductor:read','user.passenger:read'));
