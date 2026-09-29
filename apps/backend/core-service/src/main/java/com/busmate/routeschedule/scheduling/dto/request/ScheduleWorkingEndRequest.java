package com.busmate.routeschedule.scheduling.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record ScheduleWorkingEndRequest(@NotNull(message = "Say the last day it applied") LocalDate effectiveEndDate) {
}
