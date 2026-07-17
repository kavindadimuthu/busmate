-- telemetry-service schema baseline (IoT Platform Layer plan, Phase 0).
--
-- Phase 0 stands up the service, broker, and migration pipeline only — the device registry,
-- credentials, assignment, and live-state tables land in Phase 1 as V002+. This baseline just
-- establishes the schema and the extensions those tables will rely on, so a fresh database boots
-- cleanly and Flyway has a V001 to adopt via baseline-on-migrate on any pre-existing database.

-- gen_random_uuid() for UUID primary keys used throughout the registry (Phase 1 onward).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
