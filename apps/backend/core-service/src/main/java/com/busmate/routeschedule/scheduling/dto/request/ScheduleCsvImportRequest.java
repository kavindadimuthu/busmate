package com.busmate.routeschedule.scheduling.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request options for CSV-based schedule import with flexible configuration")
public class ScheduleCsvImportRequest {
    
    @Schema(
        description = "Strategy for handling duplicate schedules (same name + route_id + effective_start_date)",
        allowableValues = {"SKIP", "UPDATE", "CREATE_WITH_SUFFIX"},
        example = "SKIP"
    )
    private ScheduleDuplicateStrategy scheduleDuplicateStrategy = ScheduleDuplicateStrategy.SKIP;
    
    @Schema(
        description = "Strategy for handling duplicate schedule stops within a schedule",
        allowableValues = {"SKIP", "UPDATE"},
        example = "UPDATE"
    )
    private ScheduleStopDuplicateStrategy scheduleStopDuplicateStrategy = ScheduleStopDuplicateStrategy.UPDATE;
    
    @Schema(
        description = "Whether to validate that route_id exists in the system",
        example = "true"
    )
    private Boolean validateRouteExists = true;
    
    @Schema(
        description = "Whether to validate that route_stop_id exists and belongs to the specified route",
        example = "true"
    )
    private Boolean validateRouteStopExists = true;
    
    @Schema(
        description = "Whether to continue processing remaining rows when encountering errors in individual rows",
        example = "true"
    )
    private Boolean continueOnError = true;
    
    @Schema(
        description = "Whether to allow partial schedule creation when some stops fail validation",
        example = "true"
    )
    private Boolean allowPartialStops = true;
    
    @Schema(
        description = "Whether to generate trips automatically for successfully imported schedules",
        example = "false"
    )
    private Boolean generateTrips = false;
    
    @Schema(
        description = "Default status to use if not specified in CSV",
        allowableValues = {"PENDING", "ACTIVE", "INACTIVE", "CANCELLED"},
        example = "ACTIVE"
    )
    private String defaultStatus = "ACTIVE";
    
    @Schema(
        description = "Default schedule type to use if not specified in CSV",
        allowableValues = {"REGULAR", "SPECIAL"},
        example = "REGULAR"
    )
    private String defaultScheduleType = "REGULAR";
    
    @Schema(
        description = "Whether to validate time sequence (arrival time <= departure time for each stop)",
        example = "true"
    )
    private Boolean validateTimeSequence = true;
    
    @Schema(
        description = "Whether to validate stop order sequence within each schedule",
        example = "true"
    )
    private Boolean validateStopOrder = true;
    
    /**
     * Strategy for handling duplicate schedules
     */
    @Schema(description = "Strategy options for duplicate schedule handling")
    public enum ScheduleDuplicateStrategy {
        @Schema(description = "Skip the schedule entirely if it already exists (identified by name + route_id + effective_start_date)")
        SKIP,
        
        @Schema(description = "Update existing schedule with new data, replacing all schedule stops")
        UPDATE,
        
        @Schema(description = "Create new schedule with a suffix appended to the name")
        CREATE_WITH_SUFFIX
    }
    
    /**
     * Strategy for handling duplicate schedule stops within a schedule
     */
    @Schema(description = "Strategy options for duplicate schedule stop handling")
    public enum ScheduleStopDuplicateStrategy {
        @Schema(description = "Skip duplicate stops (same route_stop_id and stop_order)")
        SKIP,
        
        @Schema(description = "Update existing stop timing with new arrival/departure times")
        UPDATE
    }
}
