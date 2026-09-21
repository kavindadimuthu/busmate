-- Production database layout: one database per owning service, mirroring
-- scripts/postgres/init-dev-dbs.sql. Each service runs its own Flyway migrations against its
-- own database on first start (INC-032, ADR-020).
--
-- This runs ONCE, via docker-entrypoint-initdb.d, on a FRESH volume only. On an existing volume
-- it is ignored entirely — anything added here later must also be applied by hand to a running
-- cluster, or it will silently not exist.
--
-- No passwords or roles are set here. Services connect as the superuser the container was created
-- with (POSTGRES_PASSWORD, from config/secrets/.env), which is the pre-existing arrangement for
-- core-, user- and ticketing-service. Giving each service its own restricted role is the RLS
-- retrofit tracked in intent/context.md's known debt, not this increment.

CREATE DATABASE busmate_user;
CREATE DATABASE busmate_core;
CREATE DATABASE busmate_ticketing;

-- telemetry-service is NOT deployed in the launch stack (no hardware trackers, no live ETAs —
-- INC-032). Its database is created anyway because this script cannot run again on an existing
-- volume: without it, deploying telemetry-service later would need a manual CREATE DATABASE on a
-- live cluster. Its two runtime roles are deliberately NOT created here — they carry a real
-- password and are provisioned by scripts/postgres/provision-telemetry-app-role.sql at the point
-- the service is actually deployed (INC-024, ADR-016).
CREATE DATABASE busmate_telemetry;
