package com.busmate.routeschedule.permit.repository;

import com.busmate.routeschedule.permit.entity.BusPassengerServicePermitAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface BusPassengerServicePermitAssignmentRepository extends JpaRepository<BusPassengerServicePermitAssignment, UUID> {
    boolean existsByBusIdAndPassengerServicePermitIdAndStartDate(UUID busId, UUID passengerServicePermitId, LocalDate startDate);

    @Query("SELECT COUNT(a) FROM BusPassengerServicePermitAssignment a WHERE a.passengerServicePermit.id = :permitId " +
           "AND a.status = 'active' AND (a.endDate IS NULL OR a.endDate >= CURRENT_DATE)")
    long countActiveAssignmentsByPermitId(UUID permitId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM BusPassengerServicePermitAssignment b WHERE b.bus.id = :busId")
    boolean existsByBusId(@Param("busId") UUID busId);
}
