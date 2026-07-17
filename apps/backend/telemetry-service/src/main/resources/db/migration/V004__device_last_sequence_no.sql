-- Idempotent-ingest support (IoT Platform Layer plan, Phase 4): tracks the highest
-- deviceId-scoped sequenceNo accepted so far, letting the ingest pipeline reject
-- duplicate/out-of-order location fixes (re-delivered by a flaky MQTT/cellular link) instead of
-- double-processing or regressing bus_live_state. NULL means "no sequenced fix seen yet".
ALTER TABLE device ADD COLUMN last_sequence_no BIGINT;
