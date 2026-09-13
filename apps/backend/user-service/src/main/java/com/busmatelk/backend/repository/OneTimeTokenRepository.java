package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.OneTimeToken;
import com.busmatelk.backend.model.OneTimeTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OneTimeTokenRepository extends JpaRepository<OneTimeToken, UUID> {

    Optional<OneTimeToken> findByTokenHashAndType(String tokenHash, OneTimeTokenType type);

    /**
     * Burns any still-usable token of this type before a new one is issued, so only the most
     * recently requested reset/verify link ever works.
     *
     * <p>{@code flushAutomatically} is not optional here, and pairs with {@code clearAutomatically}
     * on every bulk query in this service. Clearing without flushing first throws away whatever the
     * caller had persisted but not yet flushed, with no error — this query silently dropped the
     * identity and profile rows during registration until INC-004.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update OneTimeToken t set t.consumedAt = :now "
            + "where t.userId = :userId and t.type = :type and t.consumedAt is null")
    int invalidateActive(@Param("userId") UUID userId, @Param("type") OneTimeTokenType type, @Param("now") Instant now);
}
