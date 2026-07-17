package com.busmatelk.telemetry.device.repository;

import com.busmatelk.telemetry.device.entity.DeviceCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DeviceCredentialRepository extends JpaRepository<DeviceCredential, UUID> {

    List<DeviceCredential> findByDeviceId(UUID deviceId);

    /** Revoke every currently-active credential of a device (used on rotation and on device disable). */
    @Modifying
    @Query("update DeviceCredential c set c.revokedAt = :at " +
            "where c.deviceId = :deviceId and c.revokedAt is null")
    int revokeActiveForDevice(@Param("deviceId") UUID deviceId, @Param("at") Instant at);
}
