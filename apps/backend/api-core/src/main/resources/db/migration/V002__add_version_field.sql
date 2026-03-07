-- Migration: Add Version Field for Optimistic Locking
-- Description: Adds a version column to all entities for optimistic locking support
--              This prevents lost updates in concurrent modification scenarios
-- Author: Refactoring Phase 1
-- Date: 2026-03-07

-- Note: This migration is for production deployment reference.
-- In development, JPA's ddl-auto=update handles this automatically.

-- Add version column to all tables that extend BaseEntity
-- The version field starts at 0 for existing records

ALTER TABLE route 
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE route_group 
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE stop 
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE route_stop 
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Set NOT NULL constraint after adding default values
ALTER TABLE route 
ALTER COLUMN version SET NOT NULL;

ALTER TABLE route_group 
ALTER COLUMN version SET NOT NULL;

ALTER TABLE stop 
ALTER COLUMN version SET NOT NULL;

ALTER TABLE route_stop 
ALTER COLUMN version SET NOT NULL;

-- Verification queries (commented out - for manual verification):
--
-- -- Check if version column was added to all tables:
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE column_name = 'version'
--   AND table_name IN ('route', 'route_group', 'stop', 'route_stop')
-- ORDER BY table_name;
--
-- -- Verify all existing records have version = 0:
-- SELECT 'route' as table_name, version, COUNT(*) FROM route GROUP BY version
-- UNION ALL
-- SELECT 'route_group', version, COUNT(*) FROM route_group GROUP BY version
-- UNION ALL
-- SELECT 'stop', version, COUNT(*) FROM stop GROUP BY version
-- UNION ALL
-- SELECT 'route_stop', version, COUNT(*) FROM route_stop GROUP BY version;

-- Notes on Optimistic Locking:
-- =============================
-- The @Version annotation in JPA enables optimistic locking:
--
-- 1. When an entity is first persisted, version is set to 0
-- 2. On each update, JPA increments the version
-- 3. UPDATE statements include a WHERE version = <current_version> clause
-- 4. If another transaction updated the record (version changed), the WHERE clause fails
-- 5. JPA throws OptimisticLockException, preventing lost updates
--
-- Example scenario:
-- - User A loads Route with version=5
-- - User B loads same Route with version=5
-- - User A updates → version becomes 6
-- - User B tries to update → WHERE version=5 fails → OptimisticLockException
--
-- This is better than pessimistic locking (SELECT FOR UPDATE) for high-concurrency scenarios
-- because it doesn't hold database locks during user think time.
