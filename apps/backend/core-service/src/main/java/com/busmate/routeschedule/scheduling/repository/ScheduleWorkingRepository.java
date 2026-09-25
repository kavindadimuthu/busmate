package com.busmate.routeschedule.scheduling.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.busmate.routeschedule.scheduling.entity.ScheduleWorking;

@Repository
public interface ScheduleWorkingRepository extends JpaRepository<ScheduleWorking, UUID> {

    @Query("SELECT DISTINCT w FROM ScheduleWorking w LEFT JOIN FETCH w.vehicles LEFT JOIN FETCH w.operator " +
           "WHERE w.schedule.id = :scheduleId ORDER BY w.effectiveStartDate ASC")
    List<ScheduleWorking> findAllForSchedule(@Param("scheduleId") UUID scheduleId);

    @Query("SELECT DISTINCT w FROM ScheduleWorking w LEFT JOIN FETCH w.vehicles LEFT JOIN FETCH w.operator " +
           "WHERE w.id IN (SELECT v.working.id FROM ScheduleWorkingVehicle v WHERE v.id = :vehicleId)")
    java.util.Optional<ScheduleWorking> findByVehicleId(@Param("vehicleId") UUID vehicleId);
}
