-- Tier 2 reference data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3): the canonical
-- set of device kinds the registry recognizes. Required in every environment — device.device_type_code
-- is a NOT NULL FK, so no device can be registered without these rows. Repeatable migration, safe to
-- re-run: upserts by the natural key (code), never deletes.
INSERT INTO device_type (code, display_name, description)
VALUES
    ('GPS_TRACKER',    'GPS Tracker',        'Dedicated hardware GPS/telematics unit installed in a bus.'),
    ('CONDUCTOR_APP',  'Conductor App',      'The conductor mobile app acting as a location source while a trip is active.'),
    ('SIMULATOR',       'Device Simulator',  'Software simulator that replays routes for load-testing and demos.'),
    ('MQTT_CONSUMER',  'MQTT Consumer',      'Internal service account: telemetry-service''s own MQTT subscriber authenticates through the same device-credential mechanism as real devices (Phase 4), not a special-cased bypass.')
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description  = EXCLUDED.description;
