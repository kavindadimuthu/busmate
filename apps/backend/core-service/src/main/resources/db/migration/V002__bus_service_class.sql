-- INC-011: a bus's fare tier becomes recorded fact instead of a guess.
--
-- base_fare prices five service classes, but nothing on the bus said which one it was, so the
-- passenger apps inferred it from the air-conditioning flag in `facilities`. A fare is money;
-- inferring it from equipment prices a seat wrongly whenever the inference is wrong.
--
-- Existing rows default to NORMAL rather than an inferred class: an operator correcting a wrong
-- NORMAL is a visible, cheap fix, whereas an inferred LUXURY silently overcharges passengers.
-- Demo fleet classes are set separately in db/seed/dev, which is where demo facts belong.
ALTER TABLE public.bus
    ADD COLUMN service_class character varying(32) NOT NULL DEFAULT 'NORMAL';

ALTER TABLE public.bus
    ADD CONSTRAINT bus_service_class_check CHECK (service_class::text = ANY (ARRAY[
        'NORMAL'::character varying,
        'SEMI_LUXURY'::character varying,
        'LUXURY'::character varying,
        'SUPER_LUXURY'::character varying,
        'EXPRESSWAY_SUPER_LUXURY'::character varying]::text[]));
