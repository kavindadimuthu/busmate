-- INC-045 (ADR-024): who normally works a departure, as claims that may be unresolved. Nothing here touches
-- trip: a working is displayed, never written onto a trip.
--
-- operator_id and bus_id are nullable by design. A contributor records what they saw — a name, a plate — and
-- staff link it to a real operator or bus later; Bus keeps every requirement it has because those are
-- fleet-registry facts. An unresolved claim is valid, not an error. Both tables carry the same provenance
-- columns as schedule (V007), so an official time and a passenger's plate can sit on one service with their
-- own tiers.

CREATE TABLE public.schedule_working (
    id uuid PRIMARY KEY,
    version bigint,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_by character varying(255),
    schedule_id uuid NOT NULL REFERENCES public.schedule (id) ON DELETE CASCADE,
    effective_start_date date NOT NULL,
    effective_end_date date,
    operator_id uuid REFERENCES public.operator (id),
    operator_name_observed character varying(255),
    service_class character varying(32),
    source_tier character varying(8) NOT NULL DEFAULT 'SRC_4',
    observed_at timestamp with time zone NOT NULL DEFAULT now(),
    base_confidence integer NOT NULL DEFAULT 50,
    attributed_user_id uuid,
    attribution_label character varying(255) NOT NULL DEFAULT 'BusMate',
    CONSTRAINT schedule_working_dates_check CHECK (effective_end_date IS NULL OR effective_end_date >= effective_start_date),
    CONSTRAINT schedule_working_service_class_check CHECK (service_class IS NULL OR service_class IN
        ('NORMAL', 'SEMI_LUXURY', 'LUXURY', 'SUPER_LUXURY', 'EXPRESSWAY_SUPER_LUXURY')),
    CONSTRAINT schedule_working_source_tier_check CHECK (source_tier IN ('SRC_1','SRC_2','SRC_3','SRC_4','SRC_5','SRC_6')),
    CONSTRAINT schedule_working_base_confidence_check CHECK (base_confidence BETWEEN 0 AND 100)
);

-- One working per operator per schedule per start date. The operator is the linked one, or the name as seen
-- (case-insensitive) while it is unresolved, or none. Two operators on one departure are two workings, which is
-- how a cross-operator rotation is recorded. The service also refuses overlapping date ranges for the same
-- operator; this index is the backstop for the simple collision.
CREATE UNIQUE INDEX uq_schedule_working_operator_start ON public.schedule_working
    (schedule_id, (COALESCE(operator_id::text, lower(operator_name_observed), '')), effective_start_date);
CREATE INDEX idx_schedule_working_schedule ON public.schedule_working (schedule_id);
CREATE INDEX idx_schedule_working_operator ON public.schedule_working (operator_id) WHERE operator_id IS NOT NULL;

CREATE TABLE public.schedule_working_vehicle (
    id uuid PRIMARY KEY,
    version bigint,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_by character varying(255),
    working_id uuid NOT NULL REFERENCES public.schedule_working (id) ON DELETE CASCADE,
    bus_id uuid REFERENCES public.bus (id),
    plate_observed character varying(32),
    source_tier character varying(8) NOT NULL DEFAULT 'SRC_4',
    observed_at timestamp with time zone NOT NULL DEFAULT now(),
    base_confidence integer NOT NULL DEFAULT 50,
    attributed_user_id uuid,
    attribution_label character varying(255) NOT NULL DEFAULT 'BusMate',
    CONSTRAINT schedule_working_vehicle_named_check CHECK (bus_id IS NOT NULL OR plate_observed IS NOT NULL),
    CONSTRAINT schedule_working_vehicle_source_tier_check CHECK (source_tier IN ('SRC_1','SRC_2','SRC_3','SRC_4','SRC_5','SRC_6')),
    CONSTRAINT schedule_working_vehicle_base_confidence_check CHECK (base_confidence BETWEEN 0 AND 100)
);

-- Several vehicle rows on one working mean "one of these"; the same vehicle twice means nothing.
CREATE UNIQUE INDEX uq_schedule_working_vehicle ON public.schedule_working_vehicle
    (working_id, (COALESCE(bus_id::text, upper(plate_observed))));
CREATE INDEX idx_schedule_working_vehicle_bus ON public.schedule_working_vehicle (bus_id) WHERE bus_id IS NOT NULL;
