-- INC-027: every stop, route, route group and schedule says where it came from, when it was last
-- observed, and whom to credit (ADR-007, ADR-018). route_stop and schedule_stop inherit from their
-- parent and gain nothing.
--
-- DEFAULT values keep every existing writer working — including dev seed scripts that insert these
-- rows with an explicit column list. Nothing here is known to come from a gazette, so every existing
-- row is labelled SRC_4 ("BusMate"); an owner who knows some records are official upgrades them
-- deliberately, never this migration.

ALTER TABLE public.stop
    ADD COLUMN source_tier character varying(8) NOT NULL DEFAULT 'SRC_4',
    ADD COLUMN observed_at timestamp with time zone NOT NULL DEFAULT now(),
    ADD COLUMN base_confidence integer NOT NULL DEFAULT 50,
    ADD COLUMN attributed_user_id uuid,
    ADD COLUMN attribution_label character varying(255) NOT NULL DEFAULT 'BusMate';

ALTER TABLE public.route
    ADD COLUMN source_tier character varying(8) NOT NULL DEFAULT 'SRC_4',
    ADD COLUMN observed_at timestamp with time zone NOT NULL DEFAULT now(),
    ADD COLUMN base_confidence integer NOT NULL DEFAULT 50,
    ADD COLUMN attributed_user_id uuid,
    ADD COLUMN attribution_label character varying(255) NOT NULL DEFAULT 'BusMate';

ALTER TABLE public.route_group
    ADD COLUMN source_tier character varying(8) NOT NULL DEFAULT 'SRC_4',
    ADD COLUMN observed_at timestamp with time zone NOT NULL DEFAULT now(),
    ADD COLUMN base_confidence integer NOT NULL DEFAULT 50,
    ADD COLUMN attributed_user_id uuid,
    ADD COLUMN attribution_label character varying(255) NOT NULL DEFAULT 'BusMate';

ALTER TABLE public.schedule
    ADD COLUMN source_tier character varying(8) NOT NULL DEFAULT 'SRC_4',
    ADD COLUMN observed_at timestamp with time zone NOT NULL DEFAULT now(),
    ADD COLUMN base_confidence integer NOT NULL DEFAULT 50,
    ADD COLUMN attributed_user_id uuid,
    ADD COLUMN attribution_label character varying(255) NOT NULL DEFAULT 'BusMate';

-- Backfill: observed when the row was last touched, not when this migration ran.
UPDATE public.stop        SET observed_at = COALESCE(updated_at, created_at)::timestamptz WHERE COALESCE(updated_at, created_at) IS NOT NULL;
UPDATE public.route       SET observed_at = COALESCE(updated_at, created_at)::timestamptz WHERE COALESCE(updated_at, created_at) IS NOT NULL;
UPDATE public.route_group SET observed_at = COALESCE(updated_at, created_at)::timestamptz WHERE COALESCE(updated_at, created_at) IS NOT NULL;
UPDATE public.schedule    SET observed_at = COALESCE(updated_at, created_at)::timestamptz WHERE COALESCE(updated_at, created_at) IS NOT NULL;

ALTER TABLE public.stop
    ADD CONSTRAINT stop_source_tier_check CHECK (source_tier IN ('SRC_1','SRC_2','SRC_3','SRC_4','SRC_5','SRC_6')),
    ADD CONSTRAINT stop_base_confidence_check CHECK (base_confidence BETWEEN 0 AND 100);
ALTER TABLE public.route
    ADD CONSTRAINT route_source_tier_check CHECK (source_tier IN ('SRC_1','SRC_2','SRC_3','SRC_4','SRC_5','SRC_6')),
    ADD CONSTRAINT route_base_confidence_check CHECK (base_confidence BETWEEN 0 AND 100);
ALTER TABLE public.route_group
    ADD CONSTRAINT route_group_source_tier_check CHECK (source_tier IN ('SRC_1','SRC_2','SRC_3','SRC_4','SRC_5','SRC_6')),
    ADD CONSTRAINT route_group_base_confidence_check CHECK (base_confidence BETWEEN 0 AND 100);
ALTER TABLE public.schedule
    ADD CONSTRAINT schedule_source_tier_check CHECK (source_tier IN ('SRC_1','SRC_2','SRC_3','SRC_4','SRC_5','SRC_6')),
    ADD CONSTRAINT schedule_base_confidence_check CHECK (base_confidence BETWEEN 0 AND 100);
