package com.busmate.routeschedule.community.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.busmate.routeschedule.community.entity.PassengerReport;
import com.busmate.routeschedule.community.entity.ReportedEntityType;
import com.busmate.routeschedule.community.entity.ReportStatus;

@Repository
public interface PassengerReportRepository extends JpaRepository<PassengerReport, UUID> {

    Optional<PassengerReport> findByReporterUserIdAndEntityTypeAndTargetIdAndStatus(
            UUID reporterUserId, ReportedEntityType entityType, UUID targetId, ReportStatus status);

    @Query("SELECT r FROM PassengerReport r WHERE (:status IS NULL OR r.status = :status) "
            + "AND (:entityType IS NULL OR r.entityType = :entityType) ORDER BY r.createdAt ASC")
    Page<PassengerReport> findQueue(@Param("status") ReportStatus status,
                                     @Param("entityType") ReportedEntityType entityType, Pageable pageable);

    long countByEntityTypeAndTargetIdAndStatus(ReportedEntityType entityType, UUID targetId, ReportStatus status);
}
