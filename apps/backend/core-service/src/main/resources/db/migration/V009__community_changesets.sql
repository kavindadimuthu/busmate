-- INC-030: a contributor's proposed change to a network record, held apart from the canonical
-- tables until a reviewer approves it (ADR-018). Generic by entity type so routes and schedules
-- can reuse it later; only 'STOP' is accepted by the application today.

CREATE TABLE public.changeset (
    id uuid PRIMARY KEY,
    entity_type character varying(16) NOT NULL,
    -- Null for a CREATE proposal (there is no target yet).
    target_id uuid,
    action character varying(8) NOT NULL,
    -- The proposed values, shaped like that entity's staff request DTO.
    proposed_values jsonb NOT NULL,
    -- The target's version and values when this was proposed (both null for CREATE). Read at
    -- review time (INC-031) to refuse a proposal against a record that has since changed.
    target_version bigint,
    target_snapshot jsonb,
    observed_on date NOT NULL,
    observation_method character varying(24) NOT NULL,
    note character varying(500),
    status character varying(16) NOT NULL DEFAULT 'PENDING',
    proposer_user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    -- Decision fields: written by INC-031, present now so that increment adds no migration of
    -- its own.
    decided_by uuid,
    decided_at timestamp with time zone,
    decision_reason character varying(500),
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT changeset_entity_type_check CHECK (entity_type IN ('STOP')),
    CONSTRAINT changeset_action_check CHECK (action IN ('CREATE', 'UPDATE')),
    CONSTRAINT changeset_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
    CONSTRAINT changeset_observation_method_check CHECK (observation_method IN
        ('RODE_THE_ROUTE', 'LIVES_OR_WORKS_NEARBY', 'TIMETABLE_OR_SIGNBOARD', 'TOLD_BY_CREW', 'OTHER')),
    -- An UPDATE always names its target; a CREATE never does.
    CONSTRAINT changeset_target_matches_action_check CHECK (
        (action = 'UPDATE' AND target_id IS NOT NULL) OR (action = 'CREATE' AND target_id IS NULL)),
    CONSTRAINT changeset_decision_reason_check CHECK (status NOT IN ('REJECTED') OR decision_reason IS NOT NULL)
);

CREATE INDEX idx_changeset_proposer ON public.changeset (proposer_user_id, created_at);
CREATE INDEX idx_changeset_review_queue ON public.changeset (entity_type, status, created_at);

-- One pending correction per contributor per stop (the design's "one pending proposal per
-- contributor per stop"); a CREATE has no target_id so is never restricted by this.
CREATE UNIQUE INDEX uq_changeset_pending_per_target ON public.changeset (proposer_user_id, target_id)
    WHERE status = 'PENDING' AND target_id IS NOT NULL;
