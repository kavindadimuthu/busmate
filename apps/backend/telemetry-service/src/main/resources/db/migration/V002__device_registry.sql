-- Device registry, credentials, bus assignment, and live-state (IoT Platform Layer plan, Phase 1,
-- §4). telemetry-service owns these; bus_id / trip_id are soft references into core-service (no
-- cross-database FK — the same convention the other services use between service boundaries).

-- Canonical device kinds. Rows seeded as Tier-2 reference data in db/reference/R__001_device_types.sql.
CREATE TABLE device_type (
    code         VARCHAR(40)  PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL,
    description  TEXT
);

-- A physical (GPS tracker) or logical (conductor app instance) device that emits telemetry.
CREATE TABLE device (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number    VARCHAR(120) NOT NULL UNIQUE,
    device_type_code VARCHAR(40)  NOT NULL REFERENCES device_type (code),
    label            VARCHAR(160),
    status           VARCHAR(20)  NOT NULL DEFAULT 'PROVISIONED'
                     CHECK (status IN ('PROVISIONED', 'ACTIVE', 'DISABLED', 'RETIRED')),
    last_seen_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Per-device secrets. Only the hash is stored; the plaintext token is shown once at issue time.
-- A device can hold multiple credentials over its life (rotation); the active one has
-- revoked_at IS NULL and (expires_at IS NULL OR expires_at > now()).
CREATE TABLE device_credential (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID        NOT NULL REFERENCES device (id) ON DELETE CASCADE,
    credential_type VARCHAR(30) NOT NULL
                    CHECK (credential_type IN ('TOKEN_HASH', 'MQTT_PASSWORD_HASH', 'CERT_FINGERPRINT')),
    secret_hash     VARCHAR(200) NOT NULL,
    expires_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_device_credential_device ON device_credential (device_id);
-- Ingestion (Phase 2) authenticates a presented token by looking up its hash.
CREATE INDEX idx_device_credential_secret_hash ON device_credential (secret_hash);

-- Which bus a device is installed in, with history. unassigned_at IS NULL means the current
-- assignment. bus_id is a soft reference to core-service's bus.id.
CREATE TABLE device_assignment (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id     UUID        NOT NULL REFERENCES device (id) ON DELETE CASCADE,
    bus_id        UUID        NOT NULL,
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    unassigned_at TIMESTAMPTZ,
    created_by    VARCHAR(160)
);
CREATE INDEX idx_device_assignment_device ON device_assignment (device_id);
CREATE INDEX idx_device_assignment_bus ON device_assignment (bus_id);
-- At most one active assignment per device and per bus (enforced only over open assignments).
CREATE UNIQUE INDEX uq_device_assignment_active_device
    ON device_assignment (device_id) WHERE unassigned_at IS NULL;
CREATE UNIQUE INDEX uq_device_assignment_active_bus
    ON device_assignment (bus_id) WHERE unassigned_at IS NULL;

-- Latest known position per bus. Consumers asking "where is bus X now?" read this instead of
-- replaying Kafka. Upserted by the ingestion path (Phase 2); one row per bus.
CREATE TABLE bus_live_state (
    bus_id           UUID PRIMARY KEY,
    device_id        UUID,
    trip_id          UUID,
    lat              DOUBLE PRECISION,
    lng              DOUBLE PRECISION,
    speed_kmh        DOUBLE PRECISION,
    heading_deg      DOUBLE PRECISION,
    device_timestamp TIMESTAMPTZ,
    ingested_at      TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
