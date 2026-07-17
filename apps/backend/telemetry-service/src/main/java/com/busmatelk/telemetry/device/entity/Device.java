package com.busmatelk.telemetry.device.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A physical or logical device that emits telemetry (a GPS tracker, a conductor-app instance, a
 * simulator). Owns its lifecycle status; its bus placement lives in {@link DeviceAssignment} and
 * its secrets in {@link DeviceCredential}. See IoT Platform Layer plan §4.
 */
@Entity
@Table(name = "device")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;

    @Column(name = "device_type_code", nullable = false)
    private String deviceTypeCode;

    @Column(name = "label")
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DeviceStatus status;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    /** Set by {@code FleetHealthMonitorJob} (Phase 3) when this device has gone silent too long;
     * cleared automatically once telemetry resumes. Null = not currently flagged. */
    @Column(name = "silence_flagged_at")
    private Instant silenceFlaggedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (status == null) status = DeviceStatus.PROVISIONED;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
