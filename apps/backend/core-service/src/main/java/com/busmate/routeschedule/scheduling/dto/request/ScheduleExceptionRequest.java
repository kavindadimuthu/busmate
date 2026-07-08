package com.busmate.routeschedule.scheduling.dto.request;

import jakarta.validation.constraints.NotNull;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;

@Data
@Schema(description = "Exception date configuration for adding or removing service on specific dates")
public class ScheduleExceptionRequest {
    
    @NotNull(message = "Exception date is mandatory")
    @Schema(
        description = "The specific date for this exception (YYYY-MM-DD)", 
        example = "2025-12-25",
        required = true
    )
    private LocalDate exceptionDate;

    @NotNull(message = "Exception type is mandatory")
    @Schema(
        description = "Type of exception",
        allowableValues = {"ADDED", "REMOVED"},
        example = "REMOVED",
        implementation = String.class,
        required = true
    )
    private String exceptionType; // ADDED or REMOVED
}