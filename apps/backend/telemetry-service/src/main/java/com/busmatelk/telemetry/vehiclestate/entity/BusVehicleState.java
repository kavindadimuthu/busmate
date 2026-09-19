package com.busmatelk.telemetry.vehiclestate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Latest vehicle-telemetry snapshot per bus (INC-023). Written by ingest only; nothing reads it yet.
 * {@code operatorId} is null when core-service could not say who owns the bus at ingest time.
 */
@Entity
@Table(name = "bus_vehicle_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusVehicleState {

    @Id
    @Column(name = "bus_id")
    private UUID busId;

    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "trip_id")
    private UUID tripId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "snapshot", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> snapshot;

    @Column(name = "device_timestamp", nullable = false)
    private Instant deviceTimestamp;

    @Column(name = "ingested_at", nullable = false)
    private Instant ingestedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
