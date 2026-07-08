package com.busmate.routeschedule.scheduling.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.scheduling.entity.Schedule;

@Data
@Schema(description = "Response from CSV-based schedule import operation")
public class ScheduleCsvImportResponse {
    
    @Schema(description = "Total number of rows processed from CSV (excluding header)", example = "100")
    private Integer totalRows;
    
    @Schema(description = "Number of unique schedules identified in CSV", example = "10")
    private Integer totalSchedulesIdentified;
    
    @Schema(description = "Number of schedules successfully imported/updated", example = "8")
    private Integer successfulSchedules;
    
    @Schema(description = "Number of schedules that failed to import", example = "2")
    private Integer failedSchedules;
    
    @Schema(description = "Number of schedules skipped due to duplicate handling strategy", example = "0")
    private Integer skippedSchedules;
    
    @Schema(description = "Total number of schedule stops created", example = "45")
    private Integer totalStopsCreated;
    
    @Schema(description = "Total number of schedule stops that failed", example = "5")
    private Integer totalStopsFailed;
    
    @Schema(description = "List of errors encountered during import")
    private List<ImportError> errors = new ArrayList<>();
    
    @Schema(description = "List of warnings generated during import")
    private List<ImportWarning> warnings = new ArrayList<>();
    
    @Schema(description = "Summary message describing the import result", 
            example = "Successfully imported 8 schedules with 45 stops. 2 schedules failed, 5 stops failed.")
    private String message;
    
    @Schema(description = "Detailed summary of what was created/updated")
    private ImportSummary summary;
    
    @Data
    @Schema(description = "Details of an import error")
    public static class ImportError {
        @Schema(description = "Row number in CSV where error occurred (1-based, excluding header)", example = "5")
        private Integer rowNumber;
        
        @Schema(description = "Schedule name associated with the error", example = "Morning Express")
        private String scheduleName;
        
        @Schema(description = "Field name that caused the error", example = "route_id")
        private String field;
        
        @Schema(description = "Value that was provided", example = "invalid-uuid")
        private String value;
        
        @Schema(description = "Error message describing the issue", example = "Invalid UUID format for route_id")
        private String errorMessage;
        
        @Schema(description = "Suggested fix or action", example = "Provide a valid UUID in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        private String suggestion;
        
        @Schema(description = "Raw CSV row content for reference")
        private String rawCsvRow;
        
        @Schema(description = "Error severity level", example = "ERROR")
        private ErrorSeverity severity = ErrorSeverity.ERROR;
        
        public enum ErrorSeverity {
            ERROR,      // Prevents import of this schedule/row
            WARNING,    // Import continues but with potential issues
            INFO        // Informational only
        }
    }
    
    @Data
    @Schema(description = "Details of an import warning")
    public static class ImportWarning {
        @Schema(description = "Row number in CSV where warning occurred", example = "3")
        private Integer rowNumber;
        
        @Schema(description = "Schedule name associated with the warning", example = "Evening Service")
        private String scheduleName;
        
        @Schema(description = "Field name that generated the warning", example = "effective_end_date")
        private String field;
        
        @Schema(description = "Warning message", example = "effective_end_date is empty, schedule will have no end date")
        private String warningMessage;
        
        @Schema(description = "Action taken", example = "USED_DEFAULT")
        private String action;
        
        @Schema(description = "Additional details about the warning")
        private String details;
    }
    
    @Data
    @Schema(description = "Summary of import results")
    public static class ImportSummary {
        @Schema(description = "Number of new schedules created", example = "7")
        private Integer schedulesCreated;
        
        @Schema(description = "Number of existing schedules updated", example = "1")
        private Integer schedulesUpdated;
        
        @Schema(description = "Number of schedules skipped (duplicate strategy)", example = "2")
        private Integer schedulesSkipped;
        
        @Schema(description = "Number of schedule stops created", example = "42")
        private Integer stopsCreated;
        
        @Schema(description = "Number of schedule stops updated", example = "3")
        private Integer stopsUpdated;
        
        @Schema(description = "Number of schedule stops skipped", example = "0")
        private Integer stopsSkipped;
        
        @Schema(description = "Timestamp when import was processed")
        private LocalDateTime processedAt;
        
        @Schema(description = "User ID who performed the import", example = "admin@busmate.lk")
        private String processedBy;
        
        @Schema(description = "List of successfully created/updated schedules with details")
        private List<CreatedSchedule> createdSchedules = new ArrayList<>();
        
        @Schema(description = "Options that were used during import")
        private ImportOptionsUsed optionsUsed;
        
        @Data
        @Schema(description = "Details of a successfully imported schedule")
        public static class CreatedSchedule {
            @Schema(description = "UUID of the created/updated schedule")
            private UUID id;
            
            @Schema(description = "Name of the schedule", example = "Morning Express")
            private String name;
            
            @Schema(description = "Route ID the schedule belongs to")
            private UUID routeId;
            
            @Schema(description = "Route name", example = "Colombo - Kandy")
            private String routeName;
            
            @Schema(description = "Action taken", example = "CREATED")
            private String action; // CREATED, UPDATED, SKIPPED
            
            @Schema(description = "Number of stops created for this schedule", example = "5")
            private Integer stopsCount;
            
            @Schema(description = "Starting row number in CSV for this schedule", example = "2")
            private Integer startRowNumber;
            
            @Schema(description = "Ending row number in CSV for this schedule", example = "6")
            private Integer endRowNumber;
        }
        
        @Data
        @Schema(description = "Import options that were applied")
        public static class ImportOptionsUsed {
            private String scheduleDuplicateStrategy;
            private String scheduleStopDuplicateStrategy;
            private Boolean validateRouteExists;
            private Boolean validateRouteStopExists;
            private Boolean continueOnError;
            private Boolean allowPartialStops;
            private Boolean generateTrips;
            private String defaultStatus;
            private String defaultScheduleType;
        }
    }
}
