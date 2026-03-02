package com.busmate.routeschedule.schedule.repository;

import com.busmate.routeschedule.schedule.entity.ScheduleCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ScheduleCalendarRepository extends JpaRepository<ScheduleCalendar, UUID> {
}