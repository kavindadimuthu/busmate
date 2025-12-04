package com.busmate.routeschedule.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request for bulk updating stops from CSV file")
public class StopBulkUpdateRequest {
    
    @Schema(description = "Strategy for handling conflicts during update", 
            allowableValues = {"SKIP_CONFLICTS", "UPDATE_ALL", "UPDATE_IF_NEWER"})
    private UpdateStrategy updateStrategy = UpdateStrategy.UPDATE_ALL;
    
    @Schema(description = "Whether to create new stops if they don't exist (based on ID or name+city match)")
    private Boolean createMissing = false;
    
    @Schema(description = "Whether to update only non-null/non-empty fields from CSV (partial update)")
    private Boolean partialUpdate = false;
    
    @Schema(description = "Default country to use if not specified in CSV")
    private String defaultCountry;
    
    @Schema(description = "Whether to validate geographical coordinates")
    private Boolean validateCoordinates = true;
    
    @Schema(description = "Field to use for matching existing stops", 
            allowableValues = {"ID", "NAME_AND_CITY", "AUTO"})
    private MatchingStrategy matchingStrategy = MatchingStrategy.AUTO;
    
    public enum UpdateStrategy {
        SKIP_CONFLICTS,    // Skip rows that would cause conflicts
        UPDATE_ALL,        // Update all matching stops
        UPDATE_IF_NEWER    // Update only if CSV data is newer (requires timestamp comparison)
    }
    
    public enum MatchingStrategy {
        ID,               // Match by UUID ID (if present in CSV)
        NAME_AND_CITY,    // Match by stop name and city combination
        AUTO              // Try ID first, fallback to name+city
    }
}