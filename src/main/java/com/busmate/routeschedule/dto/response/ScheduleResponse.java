package com.busmate.routeschedule.dto.response;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ScheduleResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID routeId;
    private String routeName;
    private UUID routeGroupId;
    private String routeGroupName;
    private String scheduleType;
    private LocalDate effectiveStartDate;
    private LocalDate effectiveEndDate;
    private String status;
    private List<ScheduleStopResponse> scheduleStops;
    private List<ScheduleCalendarResponse> scheduleCalendars;
    private List<ScheduleExceptionResponse> scheduleExceptions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    @Data
    public static class ScheduleStopResponse {
        private UUID id;
        private UUID stopId;
        private String stopName;
        private LocationDto location;
        private Integer stopOrder;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(type = "string", pattern = "HH:mm:ss", example = "10:30:00")
        private LocalTime arrivalTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(type = "string", pattern = "HH:mm:ss", example = "10:35:00")
        private LocalTime departureTime;
    }

    @Data
    public static class ScheduleCalendarResponse {
        private UUID id;
        private Boolean monday;
        private Boolean tuesday;
        private Boolean wednesday;
        private Boolean thursday;
        private Boolean friday;
        private Boolean saturday;
        private Boolean sunday;
    }

    @Data
    public static class ScheduleExceptionResponse {
        private UUID id;
        private LocalDate exceptionDate;
        private String exceptionType;
    }
}