package com.busmatelk.telemetry.device.entity;

/**
 * Kind of secret held in device_credential. Mirrors the CHECK constraint on
 * device_credential.credential_type (V002). Phase 1 issues TOKEN_HASH (bearer tokens for HTTPS
 * ingestion); the others are placeholders for the MQTT/cert adapters in later phases.
 */
public enum CredentialType {
    TOKEN_HASH,
    MQTT_PASSWORD_HASH,
    CERT_FINGERPRINT
}
