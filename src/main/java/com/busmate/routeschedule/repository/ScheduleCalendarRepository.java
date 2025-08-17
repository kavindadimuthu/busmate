package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.ScheduleCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ScheduleCalendarRepository extends JpaRepository<ScheduleCalendar, UUID> {
}