package com.busmate.routeschedule.scheduling.dto.response;

import com.busmate.routeschedule.shared.dto.LocationDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class ScheduleStopDetailResponse {
    private UUID scheduleStopId;
    private UUID routeStopId;
    private UUID stopId;
    private String stopName;
    private String stopDescription;
    private LocationDto location;
    private Boolean isAccessible;
    private Integer stopOrder;
    private Double distanceFromStartKm;
    
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "08:30:00")
    private LocalTime arrivalTime;
    
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "08:32:00")
    private LocalTime departureTime;
}