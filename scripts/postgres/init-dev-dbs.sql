-- Creates one database per backend service, mirroring the three independent
-- Supabase projects used in production (user-service, core-service,
-- ticketing-service each own their data — see config/secrets/.env).
-- Runs automatically on first container start via docker-entrypoint-initdb.d.
CREATE DATABASE busmate_user;
CREATE DATABASE busmate_core;
CREATE DATABASE busmate_ticketing;
-- telemetry-service owns device registry + live-state (IoT Platform Layer plan, Phase 0).
CREATE DATABASE busmate_telemetry;

-- telemetry-service's runtime roles (INC-024, ADR-016). The service migrates as `postgres` (the table
-- owner) but serves requests as busmate_telemetry_app, which is not a superuser and cannot bypass
-- row-level security. Roles are cluster-wide, so they are created here for a fresh volume; V007
-- (run by the service) creates the group role idempotently and grants it what the runtime needs.
-- Dev-only password, like the rest of this file. An existing volume runs
-- scripts/postgres/provision-telemetry-app-role.sql instead.
CREATE ROLE telemetry_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
CREATE ROLE busmate_telemetry_app LOGIN PASSWORD 'busmate_telemetry_app'
    IN ROLE telemetry_app NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
