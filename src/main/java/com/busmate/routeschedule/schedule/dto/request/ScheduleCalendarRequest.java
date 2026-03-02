package com.busmate.routeschedule.schedule.dto.request;

import jakarta.validation.constraints.NotNull;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Calendar configuration defining which days of the week the schedule operates")
public class ScheduleCalendarRequest {
    
    @NotNull(message = "Monday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Mondays", 
        example = "true",
        required = true
    )
    private Boolean monday = false;

    @NotNull(message = "Tuesday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Tuesdays", 
        example = "true",
        required = true
    )
    private Boolean tuesday = false;

    @NotNull(message = "Wednesday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Wednesdays", 
        example = "true",
        required = true
    )
    private Boolean wednesday = false;

    @NotNull(message = "Thursday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Thursdays", 
        example = "true",
        required = true
    )
    private Boolean thursday = false;

    @NotNull(message = "Friday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Fridays", 
        example = "true",
        required = true
    )
    private Boolean friday = false;

    @NotNull(message = "Saturday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Saturdays", 
        example = "false",
        required = true
    )
    private Boolean saturday = false;

    @NotNull(message = "Sunday setting is mandatory")
    @Schema(
        description = "Whether the schedule operates on Sundays", 
        example = "false",
        required = true
    )
    private Boolean sunday = false;
}