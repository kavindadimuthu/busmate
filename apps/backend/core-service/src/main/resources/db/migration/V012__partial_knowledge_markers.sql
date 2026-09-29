-- INC-044 (ADR-023): a route or schedule can say how complete it is. NULL keeps meaning "not known" and
-- nothing else, so the marker is a column of its own, and only a person asserts a positive claim: every
-- existing row, and every new one that does not say, is UNKNOWN.

ALTER TABLE public.route
    ADD COLUMN stop_list_completeness character varying(16) NOT NULL DEFAULT 'UNKNOWN',
    ADD CONSTRAINT route_stop_list_completeness_check
        CHECK (stop_list_completeness IN ('COMPLETE', 'PARTIAL', 'UNKNOWN'));

ALTER TABLE public.schedule
    ADD COLUMN timing_completeness character varying(16) NOT NULL DEFAULT 'UNKNOWN',
    ADD CONSTRAINT schedule_timing_completeness_check
        CHECK (timing_completeness IN ('ALL_STOPS', 'ENDPOINTS_ONLY', 'ORIGIN_ONLY', 'UNKNOWN'));
