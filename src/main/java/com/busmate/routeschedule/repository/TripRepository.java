package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.enums.TripStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID>, JpaSpecificationExecutor<Trip> {
    
    List<Trip> findByPassengerServicePermitId(UUID passengerServicePermitId);
    
    List<Trip> findByScheduleId(UUID scheduleId);
    
    @Query("SELECT t FROM Trip t WHERE t.schedule.route.id = :routeId")
    List<Trip> findByScheduleRouteId(@Param("routeId") UUID routeId);
    
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
    
    // ============================================================================
    // STATISTICS QUERIES
    // ============================================================================
    
    @Query("SELECT COUNT(t) FROM Trip t")
    long getTotalTripsCount();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status = :status")
    long countByStatus(@Param("status") TripStatusEnum status);
    
    @Query("SELECT t.status, COUNT(t) FROM Trip t GROUP BY t.status")
    List<Object[]> getTripCountsByStatus();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.tripDate = :date")
    long countByTripDate(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.tripDate BETWEEN :startDate AND :endDate")
    long countByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.passengerServicePermit IS NOT NULL")
    long countTripsWithPsp();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.passengerServicePermit IS NULL")
    long countTripsWithoutPsp();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.bus IS NOT NULL")
    long countTripsWithBus();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.bus IS NULL")
    long countTripsWithoutBus();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.driverId IS NOT NULL")
    long countTripsWithDriver();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.conductorId IS NOT NULL")
    long countTripsWithConductor();
    
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.createdAt >= :since")
    long countRecentlyCreated(@Param("since") java.time.LocalDateTime since);
    
    @Query("SELECT s.route.name, COUNT(t) FROM Trip t JOIN t.schedule s GROUP BY s.route.name ORDER BY COUNT(t) DESC")
    List<Object[]> getTripCountsByRoute();
    
    @Query("SELECT COALESCE(t.passengerServicePermit.operator.name, t.bus.operator.name, 'No Operator'), COUNT(t) " +
           "FROM Trip t " +
           "GROUP BY COALESCE(t.passengerServicePermit.operator.name, t.bus.operator.name, 'No Operator') " +
           "ORDER BY COUNT(t) DESC")
    List<Object[]> getTripCountsByOperator();
    
    @Query("SELECT s.name, COUNT(t) FROM Trip t JOIN t.schedule s GROUP BY s.name ORDER BY COUNT(t) DESC")
    List<Object[]> getTripCountsBySchedule();
    
    @Query("SELECT " +
           "CASE " +
           "WHEN EXTRACT(HOUR FROM t.scheduledDepartureTime) BETWEEN 5 AND 11 THEN 'MORNING' " +
           "WHEN EXTRACT(HOUR FROM t.scheduledDepartureTime) BETWEEN 12 AND 17 THEN 'AFTERNOON' " +
           "WHEN EXTRACT(HOUR FROM t.scheduledDepartureTime) BETWEEN 18 AND 21 THEN 'EVENING' " +
           "ELSE 'NIGHT' " +
           "END, COUNT(t) " +
           "FROM Trip t GROUP BY " +
           "CASE " +
           "WHEN EXTRACT(HOUR FROM t.scheduledDepartureTime) BETWEEN 5 AND 11 THEN 'MORNING' " +
           "WHEN EXTRACT(HOUR FROM t.scheduledDepartureTime) BETWEEN 12 AND 17 THEN 'AFTERNOON' " +
           "WHEN EXTRACT(HOUR FROM t.scheduledDepartureTime) BETWEEN 18 AND 21 THEN 'EVENING' " +
           "ELSE 'NIGHT' " +
           "END")
    List<Object[]> getTripCountsByTimeOfDay();
    
    @Query(value = "SELECT " +
           "CASE EXTRACT(DOW FROM trip_date) " +
           "WHEN 0 THEN 'SUNDAY' " +
           "WHEN 1 THEN 'MONDAY' " +
           "WHEN 2 THEN 'TUESDAY' " +
           "WHEN 3 THEN 'WEDNESDAY' " +
           "WHEN 4 THEN 'THURSDAY' " +
           "WHEN 5 THEN 'FRIDAY' " +
           "WHEN 6 THEN 'SATURDAY' " +
           "END as day_name, COUNT(*) as trip_count " +
           "FROM trip GROUP BY EXTRACT(DOW FROM trip_date) ORDER BY EXTRACT(DOW FROM trip_date)", 
           nativeQuery = true)
    List<Object[]> getTripCountsByDayOfWeek();
    
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (actual_arrival_time - actual_departure_time))/3600.0) FROM trip WHERE actual_departure_time IS NOT NULL AND actual_arrival_time IS NOT NULL", nativeQuery = true)
    Double getAverageTripDurationHours();
    
    @Query("SELECT COUNT(t) * 100.0 / (SELECT COUNT(t2) FROM Trip t2) FROM Trip t WHERE t.status = 'completed'")
    Double getCompletionRate();
    
    @Query("SELECT COUNT(t) * 100.0 / (SELECT COUNT(t2) FROM Trip t2) FROM Trip t WHERE t.status = 'cancelled'")
    Double getCancellationRate();
    
    @Query(value = "SELECT r.name FROM trip t " +
           "JOIN schedule s ON t.schedule_id = s.id " +
           "JOIN route r ON s.route_id = r.id " +
           "GROUP BY r.name ORDER BY COUNT(*) DESC LIMIT 1", nativeQuery = true)
    String getPeakTripRoute();
    
    @Query(value = "SELECT COALESCE(po.name, bo.name, 'No Operator') as operator_name " +
           "FROM trip t " +
           "LEFT JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id " +
           "LEFT JOIN operator po ON psp.operator_id = po.id " +
           "LEFT JOIN bus b ON t.bus_id = b.id " +
           "LEFT JOIN operator bo ON b.operator_id = bo.id " +
           "GROUP BY COALESCE(po.name, bo.name, 'No Operator') " +
           "ORDER BY COUNT(*) DESC LIMIT 1", nativeQuery = true)
    String getPeakTripOperator();
    
    @Query(value = "SELECT trip_date FROM trip GROUP BY trip_date ORDER BY COUNT(*) DESC LIMIT 1", nativeQuery = true)
    LocalDate getPeakTripDate();
    
    @Query(value = "SELECT r.name FROM trip t " +
           "JOIN schedule s ON t.schedule_id = s.id " +
           "JOIN route r ON s.route_id = r.id " +
           "GROUP BY r.name ORDER BY COUNT(*) ASC LIMIT 1", nativeQuery = true)
    String getLeastActiveRoute();
    
    // ============================================================================
    // FILTER OPTIONS QUERIES
    // ============================================================================
    
    @Query("SELECT DISTINCT s.route.id, s.route.name, s.route.description, s.route.direction, s.route.routeGroup.name " +
           "FROM Trip t JOIN t.schedule s ORDER BY s.route.name")
    List<Object[]> getDistinctRoutes();
    
    @Query("SELECT DISTINCT s.route.routeGroup.id, s.route.routeGroup.name, s.route.routeGroup.description, " +
           "(SELECT COUNT(r) FROM Route r WHERE r.routeGroup.id = s.route.routeGroup.id) " +
           "FROM Trip t JOIN t.schedule s WHERE s.route.routeGroup IS NOT NULL ORDER BY s.route.routeGroup.name")
    List<Object[]> getDistinctRouteGroups();
    
    @Query(value = "SELECT DISTINCT o.id, o.name, o.operator_type, o.region " +
           "FROM trip t " +
           "LEFT JOIN passenger_service_permit p ON t.passenger_service_permit_id = p.id " +
           "LEFT JOIN operator o ON p.operator_id = o.id " +
           "WHERE o.id IS NOT NULL " +
           "UNION " +
           "SELECT DISTINCT o.id, o.name, o.operator_type, o.region " +
           "FROM trip t " +
           "LEFT JOIN bus b ON t.bus_id = b.id " +
           "LEFT JOIN operator o ON b.operator_id = o.id " +
           "WHERE o.id IS NOT NULL " +
           "ORDER BY name", nativeQuery = true)
    List<Object[]> getDistinctOperators();
    
    @Query(value = "SELECT DISTINCT s.id, s.name, r.name as route_name, " +
           "COALESCE(po.name, bo.name, 'No Operator') as operator_name, s.schedule_type " +
           "FROM trip t " +
           "JOIN schedule s ON t.schedule_id = s.id " +
           "JOIN route r ON s.route_id = r.id " +
           "LEFT JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id " +
           "LEFT JOIN operator po ON psp.operator_id = po.id " +
           "LEFT JOIN bus b ON t.bus_id = b.id " +
           "LEFT JOIN operator bo ON b.operator_id = bo.id " +
           "ORDER BY s.name", nativeQuery = true)
    List<Object[]> getDistinctSchedules();
    
    @Query(value = "SELECT DISTINCT p.id, p.permit_number, o.name as operator_name, r.name as route_name " +
           "FROM trip t " +
           "JOIN passenger_service_permit p ON t.passenger_service_permit_id = p.id " +
           "LEFT JOIN operator o ON p.operator_id = o.id " +
           "JOIN schedule s ON t.schedule_id = s.id " +
           "JOIN route r ON s.route_id = r.id " +
           "WHERE p.id IS NOT NULL " +
           "ORDER BY p.permit_number", nativeQuery = true)
    List<Object[]> getDistinctPassengerServicePermits();
    
    @Query("SELECT DISTINCT b.id, b.plateNumber, b.model, b.operator.name, b.capacity " +
           "FROM Trip t JOIN t.bus b WHERE b IS NOT NULL ORDER BY b.plateNumber")
    List<Object[]> getDistinctBuses();
}