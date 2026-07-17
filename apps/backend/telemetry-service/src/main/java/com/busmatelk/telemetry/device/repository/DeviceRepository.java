package com.busmatelk.telemetry.device.repository;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    boolean existsBySerialNumber(String serialNumber);

    Optional<Device> findBySerialNumber(String serialNumber);

    /** Backs the Phase 4 fleet-by-status Grafana gauge — evaluated at scrape time, so this stays cheap. */
    long countByStatus(DeviceStatus status);

    /** Backs the Phase 4 "silent devices" Grafana gauge. */
    long countBySilenceFlaggedAtIsNotNull();

    /** Per-conductor self-provisioning (Phase 4): find the CONDUCTOR_APP device this user already owns, if any. */
    Optional<Device> findByOwnerUserId(UUID ownerUserId);

    /** ACTIVE devices gone quiet past the threshold, not yet flagged — candidates to flag silent. */
    List<Device> findByStatusAndLastSeenAtBeforeAndSilenceFlaggedAtIsNull(DeviceStatus status, Instant threshold);

    /** Previously-flagged devices that have reported again since being flagged — candidates to
     * un-flag. This compares two columns of the same row (lastSeenAt vs. its own
     * silenceFlaggedAt), which derived-method-name queries cannot express (they only compare a
     * property to a supplied parameter), hence the explicit JPQL. */
    @Query("select d from Device d where d.silenceFlaggedAt is not null and d.lastSeenAt > d.silenceFlaggedAt")
    List<Device> findRecoveredSinceFlagged();
}
