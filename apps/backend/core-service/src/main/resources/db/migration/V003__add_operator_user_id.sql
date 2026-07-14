-- Migration: Link Operator to its owning user-service account
-- Description: Adds a nullable, unique user_id column to operator, so a core-service
--              Operator (business/regulatory entity) can be traced back to the
--              user-service User (account, userType=operator) that owns it. Part of the
--              unified operator lifecycle management work — see
--              docs/plans/Unified-Operator-Lifecycle-Management-Plan.md.
-- Date: 2026-07-09

-- Note: This migration is for production deployment reference.
-- In development, JPA's ddl-auto=update handles this automatically.

ALTER TABLE operator
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Unique so at most one Operator row can be linked to a given user-service account.
-- A plain (non-partial) unique constraint on Postgres allows any number of NULLs,
-- so pre-existing operators with no linked account are unaffected.
-- PostgreSQL has no "ADD CONSTRAINT IF NOT EXISTS", so guard it explicitly.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_operator_user_id'
    ) THEN
        ALTER TABLE operator ADD CONSTRAINT uq_operator_user_id UNIQUE (user_id);
    END IF;
END $$;

-- Verification query (commented out - for manual verification):
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'operator' AND column_name = 'user_id';
