package com.busmate.routeschedule.scheduling.repository;

import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.scheduling.enums.ScheduleStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {
    boolean existsByNameAndRoute_Id(String name, UUID routeId);

    Schedule findByNameAndRoute_Id(String name, UUID routeId);

    List<Schedule> findByRoute_Id(UUID routeId);

    Page<Schedule> findByRoute_IdAndStatus(UUID routeId, ScheduleStatusEnum status, Pageable pageable);

    @Query("SELECT s FROM Schedule s WHERE " +
            "(:routeId IS NULL OR s.route.id = :routeId) AND " +
            "(:routeGroupId IS NULL OR s.route.routeGroup.id = :routeGroupId) AND " +
            "(:scheduleType IS NULL OR s.scheduleType = :scheduleType) AND " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:searchText IS NULL OR :searchText = '' OR " +
            "LOWER(s.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(s.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(s.route.name) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    Page<Schedule> findAllWithFilters(
            @Param("routeId") UUID routeId,
            @Param("routeGroupId") UUID routeGroupId,
            @Param("scheduleType") ScheduleTypeEnum scheduleType,
            @Param("status") ScheduleStatusEnum status,
            @Param("searchText") String searchText,
            Pageable pageable);

    @Query("SELECT DISTINCT s.scheduleType FROM Schedule s WHERE s.scheduleType IS NOT NULL ORDER BY s.scheduleType")
    List<ScheduleTypeEnum> findDistinctScheduleTypes();

    @Query("SELECT DISTINCT s.status FROM Schedule s WHERE s.status IS NOT NULL ORDER BY s.status")
    List<ScheduleStatusEnum> findDistinctStatuses();

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = 'ACTIVE'")
    Long countActiveSchedules();

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = 'INACTIVE'")
    Long countInactiveSchedules();

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.scheduleType = 'REGULAR'")
    Long countRegularSchedules();

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.scheduleType = 'SPECIAL'")
    Long countSpecialSchedules();
    
    /**
     * Find active schedules for a route that are valid for a given date.
     * Uses a two-step approach to avoid MultipleBagFetchException.
     * First query fetches schedules with stops, then calendars and exceptions are lazy-loaded.
     */
    @Query("SELECT DISTINCT s FROM Schedule s " +
           "WHERE s.route.id = :routeId " +
           "AND s.status = 'ACTIVE' " +
           "AND s.effectiveStartDate <= :date " +
           "AND (s.effectiveEndDate IS NULL OR s.effectiveEndDate >= :date)")
    List<Schedule> findActiveSchedulesForRouteAndDate(@Param("routeId") UUID routeId, @Param("date") LocalDate date);
    
    /**
     * Find active schedules for multiple routes that are valid for a given date.
     * Uses a two-step approach to avoid MultipleBagFetchException.
     * First query fetches schedules with stops, then calendars and exceptions are lazy-loaded.
     */
    @Query("SELECT DISTINCT s FROM Schedule s " +
           "WHERE s.route.id IN :routeIds " +
           "AND s.status = 'ACTIVE' " +
           "AND s.effectiveStartDate <= :date " +
           "AND (s.effectiveEndDate IS NULL OR s.effectiveEndDate >= :date)")
    List<Schedule> findActiveSchedulesForRoutesAndDate(@Param("routeIds") List<UUID> routeIds, @Param("date") LocalDate date);
}