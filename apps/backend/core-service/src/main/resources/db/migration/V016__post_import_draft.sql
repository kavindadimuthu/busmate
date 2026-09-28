-- INC-060 (ADR-028): a staff member pastes a community post in any layout; an AI reads it into BusMate's own
-- shape; the server checks every value against the pasted text before anyone sees it. Nothing here writes a
-- stop, route, schedule or working — this table only holds what was read and what the checks found, so a
-- review can be reopened and any later mistake traced back to what the AI actually said versus what a
-- reviewer approved (INC-061 adds the columns for that second half).
--
-- ai_response is exactly what the provider returned, already validated against the expected shape — never
-- edited in place; a correction belongs in INC-061's own columns, once they exist, not by rewriting this.

CREATE TABLE public.post_import_draft (
    id uuid PRIMARY KEY,
    pasted_text text NOT NULL,
    ai_provider character varying(32) NOT NULL,
    ai_model character varying(64) NOT NULL,
    ai_response jsonb NOT NULL,
    status character varying(16) NOT NULL DEFAULT 'READ',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(255),
    updated_at timestamp with time zone,
    updated_by character varying(255),
    CONSTRAINT post_import_draft_status_check CHECK (status IN ('READ', 'FAILED'))
);

CREATE INDEX idx_post_import_draft_created ON public.post_import_draft (created_at DESC);
