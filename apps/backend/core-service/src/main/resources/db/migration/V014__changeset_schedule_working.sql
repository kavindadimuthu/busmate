-- INC-052 (ADR-026): a contributor can propose who usually works a departure, so a changeset may now be
-- about a schedule's working as well as a stop. Only the allowed values widen; no data changes.

ALTER TABLE public.changeset DROP CONSTRAINT changeset_entity_type_check;
ALTER TABLE public.changeset ADD CONSTRAINT changeset_entity_type_check
    CHECK (entity_type IN ('STOP', 'SCHEDULE_WORKING'));

-- A stop proposal's CREATE has no target; a working proposal's CREATE names the schedule it is for, since the
-- working does not exist yet. Every working proposal must name one.
ALTER TABLE public.changeset DROP CONSTRAINT changeset_target_matches_action_check;
ALTER TABLE public.changeset ADD CONSTRAINT changeset_target_matches_action_check CHECK (
    (action = 'UPDATE' AND target_id IS NOT NULL)
    OR (action = 'CREATE' AND entity_type = 'STOP' AND target_id IS NULL)
    OR (action = 'CREATE' AND entity_type = 'SCHEDULE_WORKING' AND target_id IS NOT NULL));
