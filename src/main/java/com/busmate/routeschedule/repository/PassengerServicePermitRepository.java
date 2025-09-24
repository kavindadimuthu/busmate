package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.PassengerServicePermit;
import com.busmate.routeschedule.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PassengerServicePermitRepository extends JpaRepository<PassengerServicePermit, UUID>, JpaSpecificationExecutor<PassengerServicePermit> {
    boolean existsByPermitNumber(String permitNumber);
    List<PassengerServicePermit> findByRouteGroupId(UUID routeGroupId);
    Page<PassengerServicePermit> findByRouteGroupId(UUID routeGroupId, Pageable pageable);
    
    // Statistics methods
    long countByStatus(StatusEnum status);
    long countByPermitType(PassengerServicePermitTypeEnum permitType);
    List<PassengerServicePermit> findByExpiryDateBetween(LocalDate startDate, LocalDate endDate);
    List<PassengerServicePermit> findByExpiryDateBefore(LocalDate date);
}
