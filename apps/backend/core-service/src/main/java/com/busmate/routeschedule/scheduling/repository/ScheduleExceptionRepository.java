package com.busmate.routeschedule.scheduling.repository;

import com.busmate.routeschedule.scheduling.entity.ScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, UUID> {
}