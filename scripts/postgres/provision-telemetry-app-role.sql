-- Creates (or rotates the password of) telemetry-service's runtime login role (INC-024, ADR-016).
--
-- Run as a role that may create roles, before or after telemetry-service's first migration: this
-- script creates the telemetry_app group role if it is missing (V007 creates it the same way and is
-- what grants it privileges). The password is passed on the command line and never lives in a
-- migration:
--
--   psql "$OWNER_URL" -v app_user=busmate_telemetry_app -v app_password='...' \
--        -f scripts/postgres/provision-telemetry-app-role.sql
--
-- Local dev (existing volume; a fresh one gets this from init-dev-dbs.sql):
--   docker exec -i busmate-dev-postgres psql -U postgres -v app_user=busmate_telemetry_app \
--        -v app_password=busmate_telemetry_app < scripts/postgres/provision-telemetry-app-role.sql
--
-- The role is deliberately not a superuser, cannot bypass row-level security, and owns nothing.
SELECT 'CREATE ROLE telemetry_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'telemetry_app')
\gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L IN ROLE telemetry_app NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE',
              :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
\gexec

SELECT format('ALTER ROLE %I PASSWORD %L NOSUPERUSER NOBYPASSRLS', :'app_user', :'app_password')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
\gexec
