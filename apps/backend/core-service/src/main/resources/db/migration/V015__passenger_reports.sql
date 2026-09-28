-- INC-056: a passenger closes the feedback loop by saying something on a departure is wrong. This is not a
-- changeset — it proposes no replacement values and never touches canonical data on its own. Any
-- authenticated user may file one (never gated behind contributor status, unlike a proposal); staff read it
-- and go fix the actual record with the tools they already have, then mark it resolved.
--
-- target_id is not a foreign key, the same choice made for changeset.target_id: it names a schedule or a
-- schedule_working depending on entity_type, and the row survives even if what it named is later removed.

CREATE TABLE public.passenger_report (
    id uuid PRIMARY KEY,
    entity_type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    reason character varying(32) NOT NULL,
    note character varying(500),
    reporter_user_id uuid NOT NULL,
    status character varying(16) NOT NULL DEFAULT 'OPEN',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    resolved_by uuid,
    resolved_at timestamp with time zone,
    resolution_note character varying(500),
    CONSTRAINT passenger_report_entity_type_check CHECK (entity_type IN ('SCHEDULE', 'SCHEDULE_WORKING')),
    CONSTRAINT passenger_report_reason_check CHECK (reason IN
        ('WRONG_TIME', 'WRONG_DAYS', 'BUS_DID_NOT_COME', 'WRONG_OPERATOR_OR_PLATE', 'OTHER')),
    CONSTRAINT passenger_report_status_check CHECK (status IN ('OPEN', 'RESOLVED')),
    CONSTRAINT passenger_report_resolution_check CHECK (status <> 'RESOLVED' OR resolved_by IS NOT NULL)
);

CREATE INDEX idx_passenger_report_queue ON public.passenger_report (status, created_at);
-- One open report per person per target: asked again, "You already reported this" rather than a duplicate row.
CREATE UNIQUE INDEX idx_passenger_report_one_open ON public.passenger_report (reporter_user_id, entity_type, target_id)
    WHERE status = 'OPEN';
