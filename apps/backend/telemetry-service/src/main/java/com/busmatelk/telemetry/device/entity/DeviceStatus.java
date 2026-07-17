package com.busmatelk.telemetry.device.entity;

/**
 * Lifecycle of a registered device. Mirrors the CHECK constraint on device.status (V002).
 */
public enum DeviceStatus {
    /** Registered but not yet seen — a credential has been issued, no telemetry received. */
    PROVISIONED,
    /** Has produced telemetry and is in service. */
    ACTIVE,
    /** Administratively disabled — credentials rejected at ingest. */
    DISABLED,
    /** Permanently withdrawn from the fleet. */
    RETIRED
}
