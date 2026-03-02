package com.busmate.routeschedule.operations.dto.request;

import com.busmate.routeschedule.shared.enums.TimePreferenceEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;
import com.busmate.routeschedule.scheduling.entity.Schedule;

/**
 * Request for Find My Bus Details API.
 * Retrieves comprehensive information about a specific schedule or trip
 * between origin and destination stops.
 */
@Data
@Schema(description = "Request to get detailed information about a specific bus schedule or trip")
public class FindMyBusDetailsRequest {
    
    @NotNull(message = "From stop ID is required")
    @Schema(description = "UUID of the origin stop", required = true, 
            example = "33333333-3333-3333-3333-333333333331")
    private UUID fromStopId;
    
    @NotNull(message = "To stop ID is required")
    @Schema(description = "UUID of the destination stop", required = true, 
            example = "33333333-3333-3333-3333-333333333332")
    private UUID toStopId;
    
    @NotNull(message = "Schedule ID is required")
    @Schema(description = "UUID of the schedule to get details for", required = true,
            example = "55555555-5555-5555-5555-555555555551")
    private UUID scheduleId;
    
    @Schema(description = "UUID of a specific trip (optional). If provided, includes trip-specific " +
            "information like bus details, operator info, and real-time data if available",
            example = "77777777-7777-7777-7777-777777777771")
    private UUID tripId;
    
    @Schema(description = "Date for calendar and exception context (defaults to today)", 
            example = "2026-02-08")
    private LocalDate date;
    
    @Schema(description = """
        Time preference for schedule stop times:
        - VERIFIED_ONLY: Only verified times (most reliable)
        - PREFER_UNVERIFIED: Verified > Unverified
        - PREFER_CALCULATED/DEFAULT: Verified > Unverified > Calculated
        """, 
        example = "DEFAULT")
    private TimePreferenceEnum timePreference = TimePreferenceEnum.DEFAULT;
}
