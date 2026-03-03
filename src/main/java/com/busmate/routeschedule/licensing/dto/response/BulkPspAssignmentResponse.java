package com.busmate.routeschedule.licensing.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.operations.dto.response.TripResponse;
import com.busmate.routeschedule.operations.entity.Trip;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response for bulk PSP assignment operation")
public class BulkPspAssignmentResponse {
    
    @Schema(description = "Total number of assignments requested")
    private int totalRequested;
    
    @Schema(description = "Number of successful assignments")
    private int successfulAssignments;
    
    @Schema(description = "Number of failed assignments")
    private int failedAssignments;
    
    @Schema(description = "Processing timestamp")
    private LocalDateTime processedAt;
    
    @Schema(description = "List of successful assignment results")
    private List<AssignmentResult> successfulResults;
    
    @Schema(description = "List of failed assignment results with error details")
    private List<AssignmentResult> failedResults;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Individual assignment result")
    public static class AssignmentResult {
        
        @Schema(description = "Trip ID")
        private UUID tripId;
        
        @Schema(description = "PSP ID")
        private UUID passengerServicePermitId;
        
        @Schema(description = "Success status")
        private boolean success;
        
        @Schema(description = "Error message if assignment failed")
        private String errorMessage;
        
        @Schema(description = "Trip details for successful assignments")
        private TripResponse tripResponse;
    }
}