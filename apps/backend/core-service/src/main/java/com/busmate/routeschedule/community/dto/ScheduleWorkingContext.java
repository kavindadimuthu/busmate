package com.busmate.routeschedule.community.dto;

import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.scheduling.dto.response.ScheduleWorkingResponse;

/** What a reviewer needs to judge a working proposal: which departure it is, and who is already recorded on it. */
public record ScheduleWorkingContext(
        UUID scheduleId,
        String scheduleName,
        String routeName,
        String routeNumber,
        List<ScheduleWorkingResponse> currentWorkings) {
}
