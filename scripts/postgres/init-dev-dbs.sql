-- Creates one database per backend service, mirroring the three independent
-- Supabase projects used in production (user-service, core-service,
-- ticketing-service each own their data — see config/secrets/.env).
-- Runs automatically on first container start via docker-entrypoint-initdb.d.
CREATE DATABASE busmate_user;
CREATE DATABASE busmate_core;
CREATE DATABASE busmate_ticketing;
-- telemetry-service owns device registry + live-state (IoT Platform Layer plan, Phase 0).
CREATE DATABASE busmate_telemetry;
