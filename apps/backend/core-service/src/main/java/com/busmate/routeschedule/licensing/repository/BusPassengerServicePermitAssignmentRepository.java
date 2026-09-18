package com.busmate.routeschedule.licensing.repository;

import com.busmate.routeschedule.licensing.entity.BusPassengerServicePermitAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BusPassengerServicePermitAssignmentRepository extends JpaRepository<BusPassengerServicePermitAssignment, UUID> {
    boolean existsByBusIdAndPassengerServicePermitIdAndStartDate(UUID busId, UUID passengerServicePermitId, LocalDate startDate);

    @Query("SELECT COUNT(a) FROM BusPassengerServicePermitAssignment a WHERE a.passengerServicePermit.id = :permitId " +
           "AND a.status = 'active' AND (a.endDate IS NULL OR a.endDate >= CURRENT_DATE)")
    long countActiveAssignmentsByPermitId(UUID permitId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM BusPassengerServicePermitAssignment b WHERE b.bus.id = :busId")
    boolean existsByBusId(@Param("busId") UUID busId);

    List<BusPassengerServicePermitAssignment> findByPassengerServicePermitIdOrderByStartDateDesc(UUID permitId);

    List<BusPassengerServicePermitAssignment> findByBusIdOrderByStartDateDesc(UUID busId);

    /** A link in force: active and not yet past its end date (INC-017). */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM BusPassengerServicePermitAssignment a " +
           "WHERE a.bus.id = :busId AND a.passengerServicePermit.id = :permitId AND a.status = 'active' " +
           "AND (a.endDate IS NULL OR a.endDate >= CURRENT_DATE)")
    boolean existsActiveLink(@Param("busId") UUID busId, @Param("permitId") UUID permitId);

    /** Links in force on a given date (INC-020 uses this to authorise a bus for a trip). */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM BusPassengerServicePermitAssignment a " +
           "WHERE a.bus.id = :busId AND a.passengerServicePermit.id = :permitId AND a.status = 'active' " +
           "AND a.startDate <= :date AND (a.endDate IS NULL OR a.endDate >= :date)")
    boolean existsLinkOnDate(@Param("busId") UUID busId, @Param("permitId") UUID permitId, @Param("date") LocalDate date);

    @Query("SELECT a FROM BusPassengerServicePermitAssignment a WHERE a.passengerServicePermit.id = :permitId " +
           "AND a.status = 'active' AND (a.endDate IS NULL OR a.endDate >= CURRENT_DATE)")
    List<BusPassengerServicePermitAssignment> findActiveByPermitId(@Param("permitId") UUID permitId);
}
