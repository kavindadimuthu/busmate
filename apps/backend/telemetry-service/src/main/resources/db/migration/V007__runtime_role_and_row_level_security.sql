-- Database-enforced operator isolation for vehicle data (INC-024, ADR-005, ADR-016).
--
-- Two roles. The role that runs this migration owns the tables. Requests are served by a separate
-- runtime role that is not a superuser, does not own the tables and has no BYPASSRLS — so the
-- policies below are the only thing between a caller and other operators' rows. A superuser bypasses
-- row-level security unconditionally, which is why the runtime must not be one.
--
-- Everything the runtime needs is granted to the password-less group role telemetry_app. The login
-- role that belongs to it is provisioned OUTSIDE migrations (scripts/postgres/
-- provision-telemetry-app-role.sql), so no credential is ever committed. Running this migration needs
-- a role that may create roles.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'telemetry_app') THEN
        CREATE ROLE telemetry_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO telemetry_app;
REVOKE CREATE ON SCHEMA public FROM telemetry_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO telemetry_app;
-- Migration history is the owner's business; the runtime has no reason to read or touch it.
REVOKE ALL ON flyway_schema_history FROM telemetry_app;
-- Tables created by later migrations (run by this same owner) are reachable without another grant.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO telemetry_app;

-- Who is acting is declared per transaction by the service (set_config(..., true), which cannot
-- outlive the transaction):
--   app.actor       'ingest' | 'staff' | 'operator'
--   app.operator_id the operator's id, when the actor is 'operator'
-- With nothing declared every policy below evaluates false: nothing is visible and nothing writable.

ALTER TABLE bus_vehicle_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_vehicle_state FORCE ROW LEVEL SECURITY;

CREATE POLICY vehicle_state_select ON bus_vehicle_state FOR SELECT TO telemetry_app
    USING (
        current_setting('app.actor', true) IN ('ingest', 'staff')
        OR (current_setting('app.actor', true) = 'operator'
            AND operator_id IS NOT NULL
            AND operator_id::text = current_setting('app.operator_id', true))
    );
CREATE POLICY vehicle_state_insert ON bus_vehicle_state FOR INSERT TO telemetry_app
    WITH CHECK (current_setting('app.actor', true) = 'ingest');
CREATE POLICY vehicle_state_update ON bus_vehicle_state FOR UPDATE TO telemetry_app
    USING (current_setting('app.actor', true) = 'ingest')
    WITH CHECK (current_setting('app.actor', true) = 'ingest');
CREATE POLICY vehicle_state_delete ON bus_vehicle_state FOR DELETE TO telemetry_app
    USING (current_setting('app.actor', true) = 'ingest');

ALTER TABLE bus_active_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_active_alert FORCE ROW LEVEL SECURITY;

CREATE POLICY active_alert_select ON bus_active_alert FOR SELECT TO telemetry_app
    USING (
        current_setting('app.actor', true) IN ('ingest', 'staff')
        OR (current_setting('app.actor', true) = 'operator'
            AND operator_id IS NOT NULL
            AND operator_id::text = current_setting('app.operator_id', true))
    );
CREATE POLICY active_alert_insert ON bus_active_alert FOR INSERT TO telemetry_app
    WITH CHECK (current_setting('app.actor', true) = 'ingest');
CREATE POLICY active_alert_update ON bus_active_alert FOR UPDATE TO telemetry_app
    USING (current_setting('app.actor', true) = 'ingest')
    WITH CHECK (current_setting('app.actor', true) = 'ingest');
CREATE POLICY active_alert_delete ON bus_active_alert FOR DELETE TO telemetry_app
    USING (current_setting('app.actor', true) = 'ingest');
