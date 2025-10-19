package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID>, JpaSpecificationExecutor<Trip> {
    
    List<Trip> findByPassengerServicePermitId(UUID passengerServicePermitId);
    
    List<Trip> findByScheduleId(UUID scheduleId);
    
    @Query("SELECT t FROM Trip t WHERE t.schedule.route.id = :routeId")
    List<Trip> findByScheduleRouteId(@Param("routeId") UUID routeId);
    
    List<Trip> findByTripDate(LocalDate tripDate);
    
    Page<Trip> findByTripDate(LocalDate tripDate, Pageable pageable);
    
    List<Trip> findByTripDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Trip> findByStatus(TripStatusEnum status);
    
    Page<Trip> findByStatus(TripStatusEnum status, Pageable pageable);
    
    List<Trip> findByBusId(UUID busId);
    
    List<Trip> findByDriverId(UUID driverId);
    
    List<Trip> findByConductorId(UUID conductorId);
    
    @Query("SELECT t FROM Trip t WHERE t.schedule.route.id = :routeId")
    Page<Trip> findByScheduleRouteId(@Param("routeId") UUID routeId, Pageable pageable);
    
    // Query to find trips by origin and destination stops
    @Query("SELECT DISTINCT t FROM Trip t " +
           "WHERE t.schedule.route.id IN (" +
           "  SELECT rs1.route.id FROM RouteStop rs1, RouteStop rs2 " +
           "  WHERE rs1.route.id = rs2.route.id " +
           "  AND rs1.stop.id = :fromStopId " +
           "  AND rs2.stop.id = :toStopId " +
           "  AND rs1.stopOrder < rs2.stopOrder" +
           ")")
    Page<Trip> findTripsByFromStopAndToStop(@Param("fromStopId") UUID fromStopId, 
                                           @Param("toStopId") UUID toStopId, 
                                           Pageable pageable);
    
    // Query to find trips by origin stop only
    @Query("SELECT DISTINCT t FROM Trip t " +
           "WHERE t.schedule.route.id IN (" +
           "  SELECT rs.route.id FROM RouteStop rs " +
           "  WHERE rs.stop.id = :fromStopId" +
           ")")
    Page<Trip> findTripsByFromStop(@Param("fromStopId") UUID fromStopId, Pageable pageable);
    
    // Query to find trips by destination stop only
    @Query("SELECT DISTINCT t FROM Trip t " +
           "WHERE t.schedule.route.id IN (" +
           "  SELECT rs.route.id FROM RouteStop rs " +
           "  WHERE rs.stop.id = :toStopId" +
           ")")
    Page<Trip> findTripsByToStop(@Param("toStopId") UUID toStopId, Pageable pageable);
    
    // Complex queries for combined filtering
    // Simple methods instead of complex queries to avoid transaction issues
    Page<Trip> findByTripDateAndStatus(LocalDate travelDate, TripStatusEnum status, Pageable pageable);
    
    @Query("SELECT DISTINCT t FROM Trip t " +
           "WHERE t.schedule.route.id IN (" +
           "  SELECT rs1.route.id FROM RouteStop rs1, RouteStop rs2 " +
           "  WHERE rs1.route.id = rs2.route.id " +
           "  AND rs1.stop.id = :fromStopId " +
           "  AND rs2.stop.id = :toStopId " +
           "  AND rs1.stopOrder < rs2.stopOrder" +
           ")")
    Page<Trip> findTripsByStopsWithFilters(@Param("fromStopId") UUID fromStopId,
                                          @Param("toStopId") UUID toStopId,
                                          Pageable pageable);
    
    @Query("SELECT DISTINCT t FROM Trip t " +
           "WHERE t.schedule.route.id IN (" +
           "  SELECT rs.route.id FROM RouteStop rs " +
           "  WHERE rs.stop.id = :fromStopId" +
           ")")
    Page<Trip> findTripsByFromStopWithFilters(@Param("fromStopId") UUID fromStopId,
                                             Pageable pageable);
    
    @Query("SELECT DISTINCT t FROM Trip t " +
           "WHERE t.schedule.route.id IN (" +
           "  SELECT rs.route.id FROM RouteStop rs " +
           "  WHERE rs.stop.id = :toStopId" +
           ")")
    Page<Trip> findTripsByToStopWithFilters(@Param("toStopId") UUID toStopId,
                                           Pageable pageable);
    
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
    
    // ============================================================================
    // PASSENGER API COMPLEX SEARCH QUERIES
    // ============================================================================
    
    /**
     * Complex search query for passenger trip search API with all filtering options
     * Simplified query to avoid PostgreSQL parameter type issues
     */
    @Query(value = """
        SELECT DISTINCT t.* FROM trip t
        INNER JOIN schedule s ON t.schedule_id = s.id
        INNER JOIN route r ON s.route_id = r.id
        LEFT JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id
        LEFT JOIN operator psp_op ON psp.operator_id = psp_op.id
        LEFT JOIN bus b ON t.bus_id = b.id
        LEFT JOIN operator bus_op ON b.operator_id = bus_op.id
        WHERE (:routeId IS NULL OR r.id = :routeId)
        AND (:travelDate IS NULL OR t.trip_date = :travelDate)
        AND (:timeAfter IS NULL OR t.scheduled_departure_time >= :timeAfter)
        AND (:timeBefore IS NULL OR t.scheduled_departure_time <= :timeBefore)
        AND (:operatorType IS NULL OR 
             COALESCE(CAST(psp_op.operator_type AS varchar), CAST(bus_op.operator_type AS varchar)) = :operatorType)
        AND (:operatorId IS NULL OR 
             COALESCE(psp_op.id, bus_op.id) = :operatorId)
        AND (:status IS NULL OR CAST(t.status AS varchar) = :status)
        ORDER BY t.trip_date, t.scheduled_departure_time
        """, nativeQuery = true)
    Page<Trip> searchTripsWithFilters(
        @Param("fromStopId") UUID fromStopId,
        @Param("toStopId") UUID toStopId, 
        @Param("fromCity") String fromCity,
        @Param("toCity") String toCity,
        @Param("routeId") UUID routeId,
        @Param("travelDate") LocalDate travelDate,
        @Param("timeAfter") LocalTime timeAfter,
        @Param("timeBefore") LocalTime timeBefore,
        @Param("operatorType") String operatorType,
        @Param("operatorId") UUID operatorId,
        @Param("status") String status,
        Pageable pageable
    );
    
    /**
     * Get active trips with comprehensive filtering for passenger API
     */
    @Query(value = """
        SELECT DISTINCT t.* FROM trip t
        INNER JOIN schedule s ON t.schedule_id = s.id
        INNER JOIN route r ON s.route_id = r.id
        LEFT JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id
        LEFT JOIN operator psp_op ON psp.operator_id = psp_op.id
        LEFT JOIN bus b ON t.bus_id = b.id
        LEFT JOIN operator bus_op ON b.operator_id = bus_op.id
        LEFT JOIN route_stop rs ON r.id = rs.route_id
        LEFT JOIN stop st ON rs.stop_id = st.id
        WHERE CAST(t.status AS varchar) IN ('active', 'in_transit', 'boarding', 'pending')
        AND (:routeId IS NULL OR r.id = :routeId)
        AND (:operatorType IS NULL OR 
             (psp_op.operator_type IS NOT NULL AND CAST(psp_op.operator_type AS varchar) = :operatorType) OR
             (psp_op.operator_type IS NULL AND CAST(bus_op.operator_type AS varchar) = :operatorType))
        AND (:operatorId IS NULL OR 
             COALESCE(psp_op.id, bus_op.id) = :operatorId)
        AND (:nearLat IS NULL OR :nearLng IS NULL OR :radius IS NULL OR
             (6371 * acos(cos(radians(:nearLat)) * cos(radians(st.latitude)) * 
              cos(radians(st.longitude) - radians(:nearLng)) + 
              sin(radians(:nearLat)) * sin(radians(st.latitude)))) <= :radius)
        ORDER BY t.trip_date DESC, t.scheduled_departure_time DESC
        """, nativeQuery = true)
    Page<Trip> findActiveTripsWithFilters(
        @Param("routeId") UUID routeId,
        @Param("operatorType") String operatorType,
        @Param("operatorId") UUID operatorId,
        @Param("nearLat") Double nearLat,
        @Param("nearLng") Double nearLng,
        @Param("radius") Double radius,
        Pageable pageable
    );
    
    /**
     * Get trip with full details including stops for passenger display
     */
    @Query(value = """
        SELECT t.*, 
               r.name as route_name, 
               r.description as route_description,
               r.distance_km as route_distance,
               r.estimated_duration_minutes as route_duration,
               start_stop.name as departure_stop_name,
               start_stop.city as departure_stop_city,
               start_stop.latitude as departure_stop_lat,
               start_stop.longitude as departure_stop_lng,
               end_stop.name as arrival_stop_name, 
               end_stop.city as arrival_stop_city,
               end_stop.latitude as arrival_stop_lat,
               end_stop.longitude as arrival_stop_lng,
               COALESCE(psp_op.name, bus_op.name) as operator_name,
               COALESCE(psp_op.operator_type::text, bus_op.operator_type::text) as operator_type,
               b.plate_number as bus_plate,
               b.capacity as bus_capacity,
               b.model as bus_model,
               b.facilities as bus_facilities
        FROM trip t
        INNER JOIN schedule s ON t.schedule_id = s.id
        INNER JOIN route r ON s.route_id = r.id
        LEFT JOIN stop start_stop ON r.start_stop_id = start_stop.id
        LEFT JOIN stop end_stop ON r.end_stop_id = end_stop.id
        LEFT JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id
        LEFT JOIN operator psp_op ON psp.operator_id = psp_op.id
        LEFT JOIN bus b ON t.bus_id = b.id
        LEFT JOIN operator bus_op ON b.operator_id = bus_op.id
        WHERE t.id = :tripId
        """, nativeQuery = true)
    Object[] getTripWithFullDetails(@Param("tripId") UUID tripId);
    
    /**
     * Get intermediate stops for a trip in order (excluding first and last stops)
     */
    @Query(value = """
        SELECT rs.stop_order,
               st.id as stop_id,
               st.name as stop_name,
               st.city as stop_city,
               st.latitude,
               st.longitude,
               ss.arrival_time,
               ss.departure_time
        FROM trip t
        INNER JOIN schedule s ON t.schedule_id = s.id
        INNER JOIN route r ON s.route_id = r.id
        INNER JOIN route_stop rs ON r.id = rs.route_id
        INNER JOIN stop st ON rs.stop_id = st.id
        LEFT JOIN schedule_stop ss ON s.id = ss.schedule_id AND rs.id = ss.route_stop_id
        WHERE t.id = :tripId
        AND rs.stop_order > 1  -- Exclude first stop
        AND rs.stop_order < (
            SELECT MAX(rs2.stop_order) 
            FROM route_stop rs2 
            WHERE rs2.route_id = r.id
        )  -- Exclude last stop
        ORDER BY rs.stop_order
        """, nativeQuery = true)
    List<Object[]> getTripIntermediateStops(@Param("tripId") UUID tripId);
}