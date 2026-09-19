package com.busmatelk.telemetry.vehiclestate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
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
 * An alert a device has raised and not cleared (INC-023). The platform never removes one on its own:
 * only a 'cleared' event from the device for the same bus, code and component does.
 */
@Entity
@Table(name = "bus_active_alert")
@IdClass(BusActiveAlertId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusActiveAlert {

    @Id
    @Column(name = "bus_id")
    private UUID busId;

    @Id
    @Column(name = "code", length = 40)
    private String code;

    /** Empty string, not null, when the alert has no component — it is part of the primary key. */
    @Id
    @Column(name = "component", length = 6)
    private String component;

    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "severity", nullable = false, length = 10)
    private String severity;

    @Column(name = "message", length = 200)
    private String message;

    @Column(name = "raised_at", nullable = false)
    private Instant raisedAt;

    @Column(name = "device_timestamp", nullable = false)
    private Instant deviceTimestamp;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
