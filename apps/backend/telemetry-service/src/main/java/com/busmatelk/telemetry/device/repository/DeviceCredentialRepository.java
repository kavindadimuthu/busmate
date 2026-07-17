package com.busmatelk.telemetry.device.repository;

import com.busmatelk.telemetry.device.entity.DeviceCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceCredentialRepository extends JpaRepository<DeviceCredential, UUID> {

    List<DeviceCredential> findByDeviceId(UUID deviceId);

    /**
     * Ingest auth (Phase 2): find the credential matching a presented token's hash, but only if it
     * is currently active (not revoked, not expired). {@code secret_hash} is indexed (V002) for
     * this exact lookup.
     *
     * <p>Written as an explicit @Query, not a derived method name: a derived
     * "...RevokedAtIsNullAndExpiresAtIsNullOrExpiresAtAfter" parses left-to-right without the
     * parentheses this condition needs — it would silently OR away the secretHash match, matching
     * any unexpired credential regardless of the token presented. Confirmed this reading Spring
     * Data's keyword-chain parsing rules, not by seeing it fail — worth being deliberate about
     * given this is the auth check for the whole ingest path.
     */
    @Query("select c from DeviceCredential c where c.secretHash = :secretHash and c.revokedAt is null " +
            "and (c.expiresAt is null or c.expiresAt > :now)")
    Optional<DeviceCredential> findActiveBySecretHash(@Param("secretHash") String secretHash, @Param("now") Instant now);

    /** Revoke every currently-active credential of a device (used on rotation and on device disable). */
    @Modifying
    @Query("update DeviceCredential c set c.revokedAt = :at " +
            "where c.deviceId = :deviceId and c.revokedAt is null")
    int revokeActiveForDevice(@Param("deviceId") UUID deviceId, @Param("at") Instant at);
}
