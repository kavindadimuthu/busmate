-- Per-conductor device self-provisioning (IoT Platform Layer plan, Phase 4) — closes Phase 2's
-- shared-credential simplification, where every conductor-mobile install reported through one
-- hardcoded demo device. owner_user_id is a soft reference to user-service's user.id (same
-- cross-service convention as device_assignment.bus_id referencing core-service), letting a
-- conductor's own login resolve back to their own CONDUCTOR_APP device.
ALTER TABLE device ADD COLUMN owner_user_id UUID;
CREATE INDEX idx_device_owner_user_id ON device (owner_user_id);
