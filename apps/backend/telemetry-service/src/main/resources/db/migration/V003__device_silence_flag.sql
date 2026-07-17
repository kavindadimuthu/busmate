-- Fleet-health tracking (IoT Platform Layer plan, Phase 3). Set by FleetHealthMonitorJob when an
-- ACTIVE device has gone quiet longer than the configured threshold; cleared automatically once the
-- device is seen again. NULL means "not currently flagged silent".
ALTER TABLE device ADD COLUMN silence_flagged_at TIMESTAMPTZ;
