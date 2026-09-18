-- INC-017: every entity row must carry an optimistic-lock version.
--
-- The `version` columns were added nullable and without a default, so rows inserted outside
-- Hibernate (the dev seed, and any data loaded by SQL) have version NULL. Hibernate then cannot
-- update them at all: incrementing a NULL version fails before the UPDATE is sent, so suspending
-- a seeded permit or editing a seeded bus answered 500. Backfill, default and forbid NULL so a
-- row inserted by any means is updatable.
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['bus', 'operator', 'passenger_service_permit',
                             'bus_passenger_service_permit_assignment', 'trip', 'schedule',
                             'route', 'route_group', 'stop']
    LOOP
        EXECUTE format('UPDATE public.%I SET version = 0 WHERE version IS NULL', t);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN version SET DEFAULT 0', t);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN version SET NOT NULL', t);
    END LOOP;
END $$;
