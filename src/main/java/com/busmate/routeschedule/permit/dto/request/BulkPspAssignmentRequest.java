package com.busmate.routeschedule.permit.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.trip.entity.Trip;

@Data
@Schema(description = "Request for bulk PSP to Trip assignments")
public class BulkPspAssignmentRequest {
    
    @NotEmpty(message = "Assignments list cannot be empty")
    @Valid
    @Schema(description = "List of PSP-Trip assignment pairs")
    private List<PspTripAssignment> assignments;
    
    @Data
    @Schema(description = "Individual PSP to Trip assignment")
    public static class PspTripAssignment {
        
        @NotNull(message = "Trip ID is mandatory")
        @Schema(description = "ID of the trip to assign PSP to")
        private UUID tripId;
        
        @NotNull(message = "Passenger Service Permit ID is mandatory")
        @Schema(description = "ID of the PSP to assign to the trip")
        private UUID passengerServicePermitId;
        
        @Schema(description = "Optional notes for this assignment")
        private String notes;
    }
}