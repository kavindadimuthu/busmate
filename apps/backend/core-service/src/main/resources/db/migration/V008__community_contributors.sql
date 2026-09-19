-- INC-029: who has applied to contribute to the network, and where they stand (ADR-019). Keyed by
-- the user-service account id; names and contact details stay in user-service and are never copied
-- here. Motivation and affiliation are personal data: never logged, erased with the account.

CREATE TABLE public.contributor (
    user_id uuid PRIMARY KEY,
    status character varying(16) NOT NULL,
    level character varying(16) NOT NULL DEFAULT 'CONTRIBUTOR',
    motivation character varying(1000) NOT NULL,
    home_district character varying(100),
    affiliation character varying(24) NOT NULL,
    affiliation_detail character varying(500),
    agreement_version character varying(40) NOT NULL,
    agreement_accepted_at timestamp with time zone NOT NULL,
    applied_at timestamp with time zone NOT NULL,
    decided_by uuid,
    decided_at timestamp with time zone,
    decision_reason character varying(500),
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT contributor_status_check CHECK (status IN ('APPLIED', 'ACTIVE', 'DECLINED', 'SUSPENDED')),
    CONSTRAINT contributor_level_check CHECK (level IN ('CONTRIBUTOR', 'STEWARD')),
    CONSTRAINT contributor_affiliation_check CHECK (affiliation IN ('NONE', 'OPERATOR_EMPLOYEE', 'BUS_OWNER', 'OTHER')),
    -- A decline or suspension always says why; the applicant sees it.
    CONSTRAINT contributor_reason_check CHECK (status NOT IN ('DECLINED', 'SUSPENDED') OR decision_reason IS NOT NULL)
);

CREATE INDEX idx_contributor_status ON public.contributor (status, applied_at);

-- The corridors an applicant knows. Not a foreign key to route_group: a group being deleted must not
-- erase what someone told us about themselves, and the portal simply shows an unknown id as gone.
CREATE TABLE public.contributor_corridor (
    user_id uuid NOT NULL REFERENCES public.contributor (user_id) ON DELETE CASCADE,
    route_group_id uuid NOT NULL,
    PRIMARY KEY (user_id, route_group_id)
);
