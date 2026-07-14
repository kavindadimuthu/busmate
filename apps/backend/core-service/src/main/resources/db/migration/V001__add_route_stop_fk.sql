-- Migration: Add Foreign Key Constraints for Route Start/End Stops
-- Description: Converts start_stop_id and end_stop_id columns from plain UUID columns 
--              to proper foreign key relationships with the stop table
-- Author: Refactoring Phase 1
-- Date: 2026-03-07

-- Note: This migration is for production deployment reference.
-- In development, JPA's ddl-auto=update handles this automatically.

-- Step 1: Ensure data integrity - remove any orphaned references
-- (Delete routes that reference non-existent stops)
DELETE FROM route 
WHERE start_stop_id IS NOT NULL 
  AND start_stop_id NOT IN (SELECT id FROM stop);

DELETE FROM route 
WHERE end_stop_id IS NOT NULL 
  AND end_stop_id NOT IN (SELECT id FROM stop);

-- Step 2: Add foreign key constraint for start_stop_id
-- If the constraint already exists (from JPA auto-creation), this will fail gracefully
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_route_start_stop'
    ) THEN
        ALTER TABLE route 
        ADD CONSTRAINT fk_route_start_stop 
        FOREIGN KEY (start_stop_id) 
        REFERENCES stop(id) 
        ON DELETE RESTRICT;  -- Prevent deleting stops that are route start points
    END IF;
END $$;

-- Step 3: Add foreign key constraint for end_stop_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_route_end_stop'
    ) THEN
        ALTER TABLE route 
        ADD CONSTRAINT fk_route_end_stop 
        FOREIGN KEY (end_stop_id) 
        REFERENCES stop(id) 
        ON DELETE RESTRICT;  -- Prevent deleting stops that are route end points
    END IF;
END $$;

-- Step 4: Add indexes for better query performance on FK columns
CREATE INDEX IF NOT EXISTS idx_route_start_stop_id ON route(start_stop_id);
CREATE INDEX IF NOT EXISTS idx_route_end_stop_id ON route(end_stop_id);

-- Verification queries (commented out - for manual verification):
-- 
-- -- Check if constraints were created:
-- SELECT conname, contype, confupdtype, confdeltype
-- FROM pg_constraint
-- WHERE conrelid = 'route'::regclass
--   AND conname IN ('fk_route_start_stop', 'fk_route_end_stop');
--
-- -- Verify no orphaned references remain:
-- SELECT COUNT(*) FROM route 
-- WHERE (start_stop_id IS NOT NULL AND start_stop_id NOT IN (SELECT id FROM stop))
--    OR (end_stop_id IS NOT NULL AND end_stop_id NOT IN (SELECT id FROM stop));
