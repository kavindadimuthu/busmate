package com.busmate.routeschedule.schedule.repository;

import com.busmate.routeschedule.schedule.entity.ScheduleStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleStopRepository extends JpaRepository<ScheduleStop, UUID> {
    
    @Query("SELECT ss FROM ScheduleStop ss " +
           "JOIN FETCH ss.routeStop rs " +
           "JOIN FETCH rs.stop s " +
           "WHERE ss.schedule.id = :scheduleId " +
           "ORDER BY ss.stopOrder ASC")
    List<ScheduleStop> findByScheduleIdOrderByStopOrder(@Param("scheduleId") UUID scheduleId);
}