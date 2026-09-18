-- INC-017: operators keep their own permit records, and MOT can suspend one.
--
-- A suspension or a withdrawal is only useful to the other party if it says why, so the reason is
-- recorded next to the status it explains. Nullable: an active permit has nothing to explain.
ALTER TABLE public.passenger_service_permit
    ADD COLUMN status_reason character varying(500);
