package com.busmate.routeschedule.fleet.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.busmate.routeschedule.fleet.entity.BusMedia;
import com.busmate.routeschedule.fleet.enums.BusMediaKindEnum;

@Repository
public interface BusMediaRepository extends JpaRepository<BusMedia, UUID> {

    List<BusMedia> findByBusIdOrderByCreatedAtAsc(UUID busId);

    long countByBusIdAndKind(UUID busId, BusMediaKindEnum kind);

    Optional<BusMedia> findFirstByBusIdAndCoverTrue(UUID busId);

    Optional<BusMedia> findFirstByBusIdAndKindOrderByCreatedAtAsc(UUID busId, BusMediaKindEnum kind);

    // Flush before and clear after: a bulk UPDATE bypasses the persistence context, and a stale
    // cached `cover = true` would otherwise make a later setCover(true) look like no change.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE BusMedia m SET m.cover = false WHERE m.bus.id = :busId AND m.cover = true")
    int clearCover(@Param("busId") UUID busId);
}
