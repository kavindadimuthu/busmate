-- INC-041: who is a steward, for which corridors, and who appointed them (ADR-019, ADR-022).
-- The `level` column already exists from V008; nothing granted STEWARD until now.
--
-- The scope is a set of route groups, stored the way a contributor's own declared corridors are: not a
-- foreign key, so a route group being deleted does not erase the record of who was appointed.

ALTER TABLE public.contributor
    ADD COLUMN steward_appointed_by uuid,
    ADD COLUMN steward_appointed_at timestamp with time zone;

CREATE TABLE public.contributor_steward_scope (
    user_id uuid NOT NULL REFERENCES public.contributor (user_id) ON DELETE CASCADE,
    route_group_id uuid NOT NULL,
    PRIMARY KEY (user_id, route_group_id)
);

-- A steward always has a scope and an appointer; a plain contributor has neither.
ALTER TABLE public.contributor ADD CONSTRAINT contributor_steward_appointment_check CHECK (
    (level = 'STEWARD' AND steward_appointed_by IS NOT NULL AND steward_appointed_at IS NOT NULL)
    OR (level <> 'STEWARD' AND steward_appointed_by IS NULL AND steward_appointed_at IS NULL));
