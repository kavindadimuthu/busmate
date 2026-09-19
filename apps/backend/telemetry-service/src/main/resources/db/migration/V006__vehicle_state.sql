-- Latest vehicle health per bus, and the alerts a device currently holds raised (INC-023).
-- telemetry-service owns these; bus_id / trip_id / operator_id are soft references into core-service
-- (no cross-database FK), like every other cross-service id here.
--
-- operator_id is on every row from this first migration (ADR-005: the one column that is expensive
-- to retrofit). It is resolved at ingest from core-service and is NULL when that lookup could not
-- be made — an untagged row is kept rather than the event dropped. Nothing reads these tables yet;
-- INC-024 adds the database-enforced isolation that a read path needs.

CREATE TABLE bus_vehicle_state (
    bus_id           UUID        PRIMARY KEY,
    operator_id      UUID,
    device_id        UUID        NOT NULL,
    trip_id          UUID,
    -- The validated vehicle-telemetry payload as received. Kept whole so the contract can grow
    -- without a migration per field; INC-024's read path decides what it exposes.
    snapshot         JSONB       NOT NULL,
    device_timestamp TIMESTAMPTZ NOT NULL,
    ingested_at      TIMESTAMPTZ NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bus_vehicle_state_operator ON bus_vehicle_state (operator_id);

-- One row per alert a device has raised and not yet cleared. The device owns clearance: a row is
-- removed only by a 'cleared' event for the same (bus, code, component), never by the platform.
-- component is '' (not NULL) when the alert has none, so it can sit in the primary key.
CREATE TABLE bus_active_alert (
    bus_id           UUID         NOT NULL,
    code             VARCHAR(40)  NOT NULL,
    component        VARCHAR(6)   NOT NULL DEFAULT '',
    operator_id      UUID,
    device_id        UUID         NOT NULL,
    severity         VARCHAR(10)  NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message          VARCHAR(200),
    raised_at        TIMESTAMPTZ  NOT NULL,
    device_timestamp TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (bus_id, code, component)
);
CREATE INDEX idx_bus_active_alert_operator ON bus_active_alert (operator_id);
