package com.busmate.routeschedule.passenger.dto.request;

import com.busmate.routeschedule.enums.RoadTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Schema(description = "Request to find buses between two stops")
public class FindMyBusRequest {
    
    @NotNull(message = "From stop ID is required")
    @Schema(description = "UUID of the origin stop", required = true, example = "33333333-3333-3333-3333-333333333331")
    private UUID fromStopId;
    
    @NotNull(message = "To stop ID is required")
    @Schema(description = "UUID of the destination stop", required = true, example = "33333333-3333-3333-3333-333333333332")
    private UUID toStopId;
    
    @Schema(description = "Date for which to find buses (defaults to today)", example = "2025-12-07")
    private LocalDate date;
    
    @JsonFormat(pattern = "HH:mm")
    @Schema(description = "Time from which to find buses (defaults to 00:00)", type = "string", pattern = "HH:mm", example = "08:00")
    private LocalTime time;
    
    @Schema(description = "Filter by route number", example = "101")
    private String routeNumber;
    
    @Schema(description = "Filter by road type", example = "NORMALWAY")
    private RoadTypeEnum roadType;
    
    @Schema(description = "Include schedule-based results when no trips available (default: true)", example = "true")
    private Boolean includeScheduledData = true;
    
    @Schema(description = "Include static route data as fallback when no schedules available (default: true)", example = "true")
    private Boolean includeRouteData = true;
}
