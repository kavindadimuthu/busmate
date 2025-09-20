package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.enums.TripStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {
    
    List<Trip> findByPassengerServicePermitId(UUID passengerServicePermitId);
    
    List<Trip> findByScheduleId(UUID scheduleId);
    
    List<Trip> findByTripDate(LocalDate tripDate);
    
    List<Trip> findByTripDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Trip> findByStatus(TripStatusEnum status);
    
    List<Trip> findByBusId(UUID busId);
    
    List<Trip> findByDriverId(UUID driverId);
    
    List<Trip> findByConductorId(UUID conductorId);
    
    @Query(value = "SELECT * FROM trip WHERE trip_date = :date AND passenger_service_permit_id = :pspId AND schedule_id = :scheduleId", nativeQuery = true)
    List<Trip> findByTripDateAndPassengerServicePermitIdAndScheduleId(@Param("date") LocalDate date, @Param("pspId") UUID pspId, @Param("scheduleId") UUID scheduleId);
    
    @Query(value = "SELECT * FROM trip WHERE trip_date = :date AND bus_id = :busId", nativeQuery = true)
    List<Trip> findByTripDateAndBusId(@Param("date") LocalDate date, @Param("busId") UUID busId);
    
    @Query(value = "SELECT * FROM trip WHERE trip_date = :date AND conductor_id = :conductorId", nativeQuery = true)
    List<Trip> findByTripDateAndConductorId(@Param("date") LocalDate date, @Param("conductorId") UUID conductorId);
    
    boolean existsByTripDateAndScheduleId(LocalDate tripDate, UUID scheduleId);
    
    boolean existsByScheduleIdAndTripDate(UUID scheduleId, LocalDate tripDate);
    
    boolean existsByPassengerServicePermitIdAndScheduleRouteIdAndTripDate(UUID passengerServicePermitId, UUID routeId, LocalDate tripDate);
    
    boolean existsByTripDateAndPassengerServicePermitIdAndScheduleId(LocalDate tripDate, UUID passengerServicePermitId, UUID scheduleId);
    
    @Query(value = "SELECT COUNT(*) FROM trip WHERE trip_date BETWEEN :startDate AND :endDate AND status = CAST(:status AS VARCHAR)", nativeQuery = true)
    long countByDateRangeAndStatus(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") String status);
}