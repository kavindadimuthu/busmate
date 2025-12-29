package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.dto.projection.FindMyBusProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository for optimized passenger query operations.
 * Uses native queries with joins to minimize database round trips.
 */
@Repository
public interface PassengerQueryRepository extends JpaRepository<com.busmate.routeschedule.entity.Route, UUID> {
    
    /**
     * Find buses between two stops with a single optimized query.
     * 
     * This query:
     * 1. Joins route_stop twice to find routes where fromStop appears before toStop
     * 2. Left joins schedule, schedule_stop, and trip tables for dynamic data
     * 3. Left joins schedule_calendar for day-of-week filtering
     * 4. Applies filters for date, time, route number, and road type
     * 5. Returns all data needed to build response in one query
     * 
     * @param fromStopId Origin stop UUID
     * @param toStopId Destination stop UUID
     * @param searchDate Date to search for
     * @param routeNumber Optional route number filter
     * @param roadType Optional road type filter
     * @return List of projections containing all necessary data
     */
    @Query(value = """
        SELECT
            -- Route Information
            r.id as routeId,
            r.name as routeName,
            r.name_sinhala as routeNameSinhala,
            r.name_tamil as routeNameTamil,
            r.route_number as routeNumber,
            r.road_type as roadType,
            r.description as routeDescription,
            r.route_through as routeThrough,
            r.route_through_sinhala as routeThroughSinhala,
            r.route_through_tamil as routeThroughTamil,
            
            -- Route Group Information
            rg.id as routeGroupId,
            rg.name as routeGroupName,
            rg.name_sinhala as routeGroupNameSinhala,
            rg.name_tamil as routeGroupNameTamil,
            
            -- From Route Stop Information
            rs1.id as fromRouteStopId,
            rs1.stop_order as fromStopOrder,
            rs1.distance_from_start_km as fromDistanceFromStart,
            
            -- To Route Stop Information
            rs2.id as toRouteStopId,
            rs2.stop_order as toStopOrder,
            rs2.distance_from_start_km as toDistanceFromStart,
            
            -- Schedule Information
            s.id as scheduleId,
            s.name as scheduleName,
            s.description as scheduleDescription,
            s.schedule_type as scheduleType,
            s.effective_start_date as scheduleStartDate,
            s.effective_end_date as scheduleEndDate,
            
            -- From Schedule Stop Information
            ss1.id as fromScheduleStopId,
            ss1.arrival_time as fromArrivalTime,
            ss1.departure_time as fromDepartureTime,
            
            -- To Schedule Stop Information
            ss2.id as toScheduleStopId,
            ss2.arrival_time as toArrivalTime,
            ss2.departure_time as toDepartureTime,
            
            -- Trip Information
            t.id as tripId,
            t.trip_date as tripDate,
            t.scheduled_departure_time as tripScheduledDepartureTime,
            t.actual_departure_time as tripActualDepartureTime,
            t.scheduled_arrival_time as tripScheduledArrivalTime,
            t.actual_arrival_time as tripActualArrivalTime,
            t.status as tripStatus,
            
            -- Bus Information
            b.id as busId,
            b.plate_number as busPlateNumber,
            b.model as busModel,
            
            -- PSP Information
            psp.id as pspId,
            psp.permit_number as pspNumber,
            
            -- Calendar Information
            sc.monday as monday,
            sc.tuesday as tuesday,
            sc.wednesday as wednesday,
            sc.thursday as thursday,
            sc.friday as friday,
            sc.saturday as saturday,
            sc.sunday as sunday
            
        FROM route_stop rs1
        INNER JOIN route r ON rs1.route_id = r.id
        INNER JOIN route_stop rs2 ON rs2.route_id = r.id
        LEFT JOIN route_group rg ON r.route_group_id = rg.id
        
        -- Left join schedule and related tables
        LEFT JOIN schedule s ON s.route_id = r.id 
            AND s.status = 'ACTIVE'
            AND s.effective_start_date <= :searchDate
            AND (s.effective_end_date IS NULL OR s.effective_end_date >= :searchDate)
        
        -- Join schedule_stop using stop_order to handle cases where route_stop_id may not match
        -- This is more reliable as stop_order is the logical sequence identifier
        LEFT JOIN schedule_stop ss1 ON ss1.schedule_id = s.id 
            AND ss1.stop_order = rs1.stop_order
        LEFT JOIN schedule_stop ss2 ON ss2.schedule_id = s.id 
            AND ss2.stop_order = rs2.stop_order
            
        LEFT JOIN schedule_calendar sc ON sc.schedule_id = s.id
        
        LEFT JOIN trip t ON t.schedule_id = s.id 
            AND t.trip_date = :searchDate
            AND t.status IN ('pending', 'active', 'in_transit', 'boarding', 'departed', 'delayed', 'completed')
        
        LEFT JOIN bus b ON t.bus_id = b.id
        LEFT JOIN passenger_service_permit psp ON t.passenger_service_permit_id = psp.id
        
        WHERE rs1.stop_id = :fromStopId
            AND rs2.stop_id = :toStopId
            AND rs1.stop_order < rs2.stop_order
            AND (:routeNumber IS NULL OR r.route_number = :routeNumber)
            AND (:roadType IS NULL OR r.road_type = :roadType)
            
        ORDER BY 
            CASE WHEN t.id IS NOT NULL THEN 0 
                 WHEN s.id IS NOT NULL THEN 1 
                 ELSE 2 END,
            COALESCE(t.actual_departure_time, t.scheduled_departure_time, ss1.departure_time),
            (rs2.distance_from_start_km - rs1.distance_from_start_km)
        """, nativeQuery = true)
    List<FindMyBusProjection> findBusesBetweenStops(
        @Param("fromStopId") UUID fromStopId,
        @Param("toStopId") UUID toStopId,
        @Param("searchDate") LocalDate searchDate,
        @Param("routeNumber") String routeNumber,
        @Param("roadType") String roadType
    );
    
    /**
     * Get schedule exceptions for specific schedules and date.
     * Used to check if a schedule is excluded or specially included on a given date.
     * 
     * @param scheduleIds List of schedule IDs to check
     * @param date Date to check for exceptions
     * @return List of objects containing schedule ID and exception type
     */
    @Query(value = """
        SELECT 
            se.schedule_id as scheduleId,
            se.exception_type as exceptionType
        FROM schedule_exception se
        WHERE se.schedule_id IN :scheduleIds
            AND se.exception_date = :date
        """, nativeQuery = true)
    List<ScheduleExceptionProjection> findScheduleExceptions(
        @Param("scheduleIds") List<UUID> scheduleIds,
        @Param("date") LocalDate date
    );
    
    /**
     * Projection for schedule exceptions.
     */
    interface ScheduleExceptionProjection {
        UUID getScheduleId();
        String getExceptionType();
    }
}
