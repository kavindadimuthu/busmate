package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ScheduleExceptionRequest {
    @NotNull(message = "Exception date is mandatory")
    private LocalDate exceptionDate;

    @NotNull(message = "Exception type is mandatory")
    private String exceptionType; // ADDED or REMOVED
}