package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleCalendarRequest {
    @NotNull(message = "Monday setting is mandatory")
    private Boolean monday = false;

    @NotNull(message = "Tuesday setting is mandatory")
    private Boolean tuesday = false;

    @NotNull(message = "Wednesday setting is mandatory")
    private Boolean wednesday = false;

    @NotNull(message = "Thursday setting is mandatory")
    private Boolean thursday = false;

    @NotNull(message = "Friday setting is mandatory")
    private Boolean friday = false;

    @NotNull(message = "Saturday setting is mandatory")
    private Boolean saturday = false;

    @NotNull(message = "Sunday setting is mandatory")
    private Boolean sunday = false;
}