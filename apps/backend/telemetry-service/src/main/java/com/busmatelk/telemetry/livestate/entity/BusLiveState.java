package com.busmatelk.telemetry.livestate.entity;

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

import java.time.Instant;
import java.util.UUID;

/**
 * Latest known position per bus — the read model consumers hit for "where is bus X now?" instead of
 * replaying Kafka. One row per bus, upserted by the ingestion path (Phase 2). Populated from Phase 2
 * onward; the table and mapping exist now so the schema is complete.
 */
@Entity
@Table(name = "bus_live_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusLiveState {

    @Id
    @Column(name = "bus_id")
    private UUID busId;

    @Column(name = "device_id")
    private UUID deviceId;

    @Column(name = "trip_id")
    private UUID tripId;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    @Column(name = "heading_deg")
    private Double headingDeg;

    @Column(name = "device_timestamp")
    private Instant deviceTimestamp;

    @Column(name = "ingested_at")
    private Instant ingestedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
