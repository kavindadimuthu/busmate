-- INC-018: a bus profile an operator can keep up to date — identity details, day-to-day
-- availability, and its photos and documents.

-- Registration details printed on the vehicle's documents. Nullable: existing buses were
-- registered without them.
ALTER TABLE public.bus
    ADD COLUMN manufacture_year integer,
    ADD COLUMN chassis_number character varying(64),
    ADD COLUMN engine_number character varying(64),
    -- Why MOT suspended or the operator retired the bus; null while active.
    ADD COLUMN status_reason character varying(500);

-- Availability is the operator's day-to-day answer to "can this bus run on a given day", kept
-- apart from `status`, which records whether the bus may run in service at all (design R3).
-- A non-AVAILABLE value applies from `availability_from` (inclusive) until `availability_until`
-- (inclusive; null = until further notice).
ALTER TABLE public.bus
    ADD COLUMN availability character varying(32) NOT NULL DEFAULT 'AVAILABLE',
    ADD COLUMN availability_from date,
    ADD COLUMN availability_until date,
    ADD COLUMN availability_note character varying(500),
    ADD CONSTRAINT bus_availability_check CHECK (availability IN ('AVAILABLE', 'UNDER_MAINTENANCE', 'OFF_ROAD')),
    ADD CONSTRAINT bus_availability_window_check CHECK (
        availability_until IS NULL OR availability_from IS NULL OR availability_until >= availability_from),
    ADD CONSTRAINT bus_manufacture_year_check CHECK (manufacture_year IS NULL OR manufacture_year BETWEEN 1950 AND 2100);

-- Photos and scanned documents of a bus. The bytes live in object storage (ADR-009); this row is
-- what makes them the bus's. The storage key is derived by the server from bus and media ids and
-- is never accepted from a client.
CREATE TABLE public.bus_media (
    id uuid NOT NULL,
    bus_id uuid NOT NULL,
    kind character varying(16) NOT NULL,
    document_type character varying(40),
    title character varying(200),
    storage_key character varying(300) NOT NULL,
    content_type character varying(100) NOT NULL,
    size_bytes bigint NOT NULL,
    cover boolean NOT NULL DEFAULT false,
    expiry_date date,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT bus_media_pkey PRIMARY KEY (id),
    CONSTRAINT bus_media_bus_fk FOREIGN KEY (bus_id) REFERENCES public.bus(id),
    CONSTRAINT bus_media_kind_check CHECK (kind IN ('PHOTO', 'DOCUMENT')),
    CONSTRAINT bus_media_document_type_check CHECK (
        (kind = 'PHOTO' AND document_type IS NULL)
        OR (kind = 'DOCUMENT' AND document_type IN ('REGISTRATION_CERTIFICATE', 'REVENUE_LICENCE',
            'INSURANCE', 'FITNESS_CERTIFICATE', 'EMISSION_CERTIFICATE', 'ROUTE_PERMIT', 'OTHER'))),
    CONSTRAINT bus_media_cover_photo_check CHECK (NOT cover OR kind = 'PHOTO')
);

CREATE INDEX bus_media_bus_idx ON public.bus_media (bus_id, kind);

-- At most one cover photo per bus, enforced where it cannot race.
CREATE UNIQUE INDEX bus_media_one_cover_idx ON public.bus_media (bus_id) WHERE cover;
