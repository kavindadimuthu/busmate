-- Tier 3 demo data, dev profile only — see R__900_demo_devices.sql for the scenario.
-- secret_hash is a real SHA-256 (see DeviceTokens), not a placeholder — every token below
-- authenticates for real once Phase 2 ingestion checks device_credential.secret_hash.
-- See docs/dev-iot-device-credentials.md for the full plaintext-token list.
--
-- Repeatable (R__), same Tier 2/Tier 3 ordering hazard as R__900 — see that file's header.
-- Idempotent via ON CONFLICT (id) DO NOTHING.
INSERT INTO device_credential (id, device_id, credential_type, secret_hash)
VALUES
    -- bmt_devseed_01_813de247c3b1f239c4d5e955 (GPS-DEMO-4521)
    ('00000000-0000-0000-0000-000000010611', '00000000-0000-0000-0000-000000010601',
     'TOKEN_HASH', 'f15211178b4f828f8092a6e2a19c45cacd844858088b65ac13ceb72e9482e1af'),
    -- bmt_devseed_02_f715e4f84949158e86b3dd69 (GPS-DEMO-7734)
    ('00000000-0000-0000-0000-000000010612', '00000000-0000-0000-0000-000000010602',
     'TOKEN_HASH', '60ac443b02fd2ed50b4b36240f8c8679c90fd093c5b95256e642d791e3db0e5c'),
    -- bmt_devseed_03_9ecbe505e29ef2191550d253 (GPS-DEMO-2210)
    ('00000000-0000-0000-0000-000000010613', '00000000-0000-0000-0000-000000010603',
     'TOKEN_HASH', '239047f27791c7bcf605d4f559865b7200f8cdc218aadabd1d188524032a694b'),
    -- bmt_devseed_04_deecb8b938fb498c32b66e8a (GPS-DEMO-9981)
    ('00000000-0000-0000-0000-000000010614', '00000000-0000-0000-0000-000000010604',
     'TOKEN_HASH', 'be4b57dd2c179df5ec59f5163b4da1186cea94c68bc9efcfb91b587147b37146'),
    -- bmt_devseed_05_c78c6a3227fbb34bb612300b (GPS-DEMO-1123)
    ('00000000-0000-0000-0000-000000010615', '00000000-0000-0000-0000-000000010605',
     'TOKEN_HASH', '68065470501040df39775a71e2f2c35f8e2a3e1e023955b0d2a56bc6ce485fe3'),
    -- bmt_devseed_06_94fa97c8fb986ac6551c270a (GPS-DEMO-1187)
    ('00000000-0000-0000-0000-000000010616', '00000000-0000-0000-0000-000000010606',
     'TOKEN_HASH', '884193ca18d8ef9e0b7d4e78006b3ca7098db284d520497365c69807be0035cf'),
    -- bmt_devseed_07_e04d83705b012955cb56e8f5 (CONDUCTOR-APP-DEMO-001)
    ('00000000-0000-0000-0000-000000010617', '00000000-0000-0000-0000-000000010607',
     'TOKEN_HASH', 'c6f1e7cc41c42698c3ed7d5556a2d005de3d1ab15869dab826434555871e31bd'),
    -- bmt_UUdpLfnE2mf18jyV8Shc4RklxGmsmcrwg8gUxssk7bU (MQTT-CONSUMER-INTERNAL) — must match
    -- TELEMETRY_MQTT_PASSWORD in docker-compose.yml/application-dev.yml.
    ('00000000-0000-0000-0000-000000010618', '00000000-0000-0000-0000-000000010608',
     'TOKEN_HASH', '71f3577b1665cc03332f46402f79ec370a4d50947da537bacd4177b7a3ced960')
ON CONFLICT (id) DO NOTHING;
