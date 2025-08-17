package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.Valid;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
public class ScheduleRequest {
    @NotBlank(message = "Name is mandatory")
    private String name;

    @NotNull(message = "Route ID is mandatory")
    private UUID routeId;

    @NotNull(message = "Schedule type is mandatory")
    private String scheduleType;

    @NotNull(message = "Effective start date is mandatory")
    private LocalDate effectiveStartDate;

    private LocalDate effectiveEndDate;

    private String status = "ACTIVE";

    private String description;

    @Valid
    private List<ScheduleStopRequest> scheduleStops;

    @Valid
    private ScheduleCalendarRequest calendar;

    @Valid
    private List<ScheduleExceptionRequest> exceptions;

    @Data
    public static class ScheduleStopRequest {
        private UUID id; // For updates
        
        @NotNull(message = "Stop ID is mandatory")
        private UUID stopId;

        @NotNull(message = "Stop order is mandatory")
        @Min(value = 0, message = "Stop order must be non-negative")
        private Integer stopOrder;

        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(type = "string", pattern = "HH:mm:ss", example = "10:30:00")
        private LocalTime arrivalTime;

        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(type = "string", pattern = "HH:mm:ss", example = "10:35:00")
        private LocalTime departureTime;
    }
}