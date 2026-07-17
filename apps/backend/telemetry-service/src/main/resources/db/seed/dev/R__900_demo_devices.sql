-- Tier 3 demo data, dev profile only (see application-dev.yml's flyway.locations). One GPS
-- tracker per demo bus from docs/dev-seed-contract.md's "Demo IoT devices" section, so the
-- management-portal device list and Phase 2's ingest simulator have something real to show
-- against the existing demo fleet (core-service's V904__demo_buses.sql).
--
-- Named R__ (repeatable), not V900__ (versioned): this service has both a db/reference tier and
-- a db/seed/dev tier, and device.device_type_code is a NOT NULL FK into device_type — a versioned
-- V900 would risk running before R__001_device_types.sql populates it. Repeatable, sorted by
-- filename after R__001, is what guarantees Tier 2 exists first (same hazard user-service's demo
-- seed hit — see its R__900_demo_users.sql for the full explanation).
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO device (id, serial_number, device_type_code, label, status)
VALUES
    ('00000000-0000-0000-0000-000000010601', 'GPS-DEMO-4521', 'GPS_TRACKER', 'WP CAA-4521 dashboard tracker', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000010602', 'GPS-DEMO-7734', 'GPS_TRACKER', 'WP CAB-7734 dashboard tracker', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000010603', 'GPS-DEMO-2210', 'GPS_TRACKER', 'SP CAA-2210 dashboard tracker', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000010604', 'GPS-DEMO-9981', 'GPS_TRACKER', 'SP CAB-9981 dashboard tracker', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000010605', 'GPS-DEMO-1123', 'GPS_TRACKER', 'CP NA-1123 dashboard tracker', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000010606', 'GPS-DEMO-1187', 'GPS_TRACKER', 'CP NA-1187 dashboard tracker', 'ACTIVE'),
    -- conductor-mobile's own GPS reporting (Phase 2) — no static bus assignment; it resolves the
    -- bus from whichever tripId it reports alongside each fix (see IngestService.resolveBusAndTrip).
    ('00000000-0000-0000-0000-000000010607', 'CONDUCTOR-APP-DEMO-001', 'CONDUCTOR_APP', 'conductor-mobile demo device', 'ACTIVE'),
    -- telemetry-service's own MQTT subscriber (Phase 4, MqttIngestAdapter) — authenticates to EMQX
    -- through the exact same device-credential webhook as a real tracker (see config/mqtt/emqx.conf),
    -- not a special-cased bypass. TELEMETRY_MQTT_USERNAME/PASSWORD in application.yml must match
    -- this device's serial/token pair — see docs/dev-iot-device-credentials.md.
    ('00000000-0000-0000-0000-000000010608', 'MQTT-CONSUMER-INTERNAL', 'MQTT_CONSUMER', 'telemetry-service MQTT subscriber', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
