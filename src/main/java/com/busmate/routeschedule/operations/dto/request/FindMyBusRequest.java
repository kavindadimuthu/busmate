package com.busmate.routeschedule.operations.dto.request;

import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import com.busmate.routeschedule.shared.enums.TimePreferenceEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Request for Find My Bus API.
 * Searches for bus services between two stops.
 */
@Data
@Schema(description = "Request to find buses between two stops")
public class FindMyBusRequest {
    
    @NotNull(message = "From stop ID is required")
    @Schema(description = "UUID of the origin stop", required = true, example = "33333333-3333-3333-3333-333333333331")
    private UUID fromStopId;
    
    @NotNull(message = "To stop ID is required")
    @Schema(description = "UUID of the destination stop", required = true, example = "33333333-3333-3333-3333-333333333332")
    private UUID toStopId;
    
    @Schema(description = "Date for which to find buses (defaults to today)", example = "2026-02-08")
    private LocalDate date;
    
    @JsonFormat(pattern = "HH:mm")
    @Schema(description = "Time from which to find buses (defaults to 00:00)", type = "string", pattern = "HH:mm", example = "08:00")
    private LocalTime time;
    
    @Schema(description = "Filter by route number", example = "101")
    private String routeNumber;
    
    @Schema(description = "Filter by road type", example = "NORMALWAY")
    private RoadTypeEnum roadType;
    
    @Schema(description = """
        Time preference for schedule stop times:
        - VERIFIED_ONLY: Only verified times (most reliable)
        - PREFER_UNVERIFIED: Verified > Unverified
        - PREFER_CALCULATED/DEFAULT: Verified > Unverified > Calculated
        """, 
        example = "DEFAULT")
    private TimePreferenceEnum timePreference = TimePreferenceEnum.DEFAULT;
}
