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
@Schema(description = "Request DTO for creating or updating a schedule")
public class ScheduleRequest {
    
    @NotBlank(message = "Name is mandatory")
    @Schema(
        description = "Unique name for this schedule within the route", 
        example = "Morning Express Service",
        required = true
    )
    private String name;

    @NotNull(message = "Route ID is mandatory")
    @Schema(
        description = "UUID of the route this schedule belongs to", 
        example = "77777777-7777-7777-7777-777777777771",
        required = true
    )
    private UUID routeId;

    @NotNull(message = "Schedule type is mandatory")
    @Schema(
        description = "Type of schedule",
        allowableValues = {"REGULAR", "SPECIAL"},
        example = "REGULAR",
        required = true
    )
    private String scheduleType;

    @NotNull(message = "Effective start date is mandatory")
    @Schema(
        description = "Date when the schedule becomes effective (YYYY-MM-DD)", 
        example = "2025-09-25",
        required = true
    )
    private LocalDate effectiveStartDate;

    @Schema(
        description = "Date when the schedule expires (YYYY-MM-DD). If not provided, schedule runs indefinitely", 
        example = "2025-12-31"
    )
    private LocalDate effectiveEndDate;

    @Schema(
        description = "Current status of the schedule",
        allowableValues = {"PENDING", "ACTIVE", "INACTIVE", "CANCELLED"},
        example = "ACTIVE",
        defaultValue = "ACTIVE"
    )
    private String status = "ACTIVE";

    @Schema(
        description = "Optional description or notes about this schedule", 
        example = "Express service during morning rush hours with limited stops"
    )
    private String description;

    @Schema(
        description = "Whether to automatically generate trips for this schedule. Requires calendar to be set for meaningful trip generation.", 
        example = "true",
        defaultValue = "false"
    )
    private boolean generateTrips = false;

    @Valid
    @Schema(
        description = "List of stops with timing information. Required for /full endpoint, ignored for basic endpoint. Must be ordered by stopOrder (0, 1, 2...)"
    )
    private List<ScheduleStopRequest> scheduleStops;

    @Valid
    @Schema(
        description = "Calendar defining which days of week this schedule operates. Required for /full endpoint, ignored for basic endpoint"
    )
    private ScheduleCalendarRequest calendar;

    @Valid
    @Schema(
        description = "List of date exceptions (added/removed service dates). Optional for both endpoints"
    )
    private List<ScheduleExceptionRequest> exceptions;

    @Data
    @Schema(description = "Stop timing information within a schedule")
    public static class ScheduleStopRequest {
        
        @Schema(
            description = "ID of existing schedule stop (used for updates only, omit for new schedules)", 
            example = "12345678-1234-1234-1234-123456789012"
        )
        private UUID id; // For updates
        
        @NotNull(message = "Stop ID is mandatory")
        @Schema(
            description = "UUID of the bus stop", 
            example = "33333333-3333-3333-3333-333333333331",
            required = true
        )
        private UUID stopId;

        @NotNull(message = "Stop order is mandatory")
        @Min(value = 0, message = "Stop order must be non-negative")
        @Schema(
            description = "Order of this stop in the route (0 = first stop, 1 = second stop, etc.)", 
            example = "0",
            required = true
        )
        private Integer stopOrder;

        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(
            description = "Time when bus arrives at this stop (24-hour format HH:mm:ss)", 
            type = "string", 
            pattern = "HH:mm:ss", 
            example = "10:30:00"
        )
        private LocalTime arrivalTime;

        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(
            description = "Time when bus departs from this stop (24-hour format HH:mm:ss). Must be >= arrivalTime", 
            type = "string", 
            pattern = "HH:mm:ss", 
            example = "10:35:00"
        )
        private LocalTime departureTime;
    }
}