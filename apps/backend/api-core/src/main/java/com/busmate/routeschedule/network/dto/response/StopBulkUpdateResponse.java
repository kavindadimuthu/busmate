package com.busmate.routeschedule.network.dto.response;

import com.busmate.routeschedule.network.dto.response.StopResponse;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StopBulkUpdateResponse {
    
    // Summary statistics
    private UpdateSummary summary;
    
    // Detailed results
    private List<UpdateResult> updateResults;
    private List<SkippedRecord> skippedRecords;
    private List<ErrorRecord> errorRecords;
    
    // Metadata
    private UpdateMetadata metadata;
    
    @Data
    public static class UpdateSummary {
        private Integer totalRowsProcessed;
        private Integer successfulUpdates;
        private Integer successfulCreations;
        private Integer skippedRows;
        private Integer errorRows;
        private Double successRate; // Percentage
    }
    
    @Data
    public static class UpdateResult {
        private Integer rowNumber;
        private UUID stopId;
        private String stopName;
        private String operation; // "UPDATED", "CREATED"
        private String matchedBy; // "ID", "NAME_AND_CITY"
        private List<String> updatedFields;
        private StopResponse updatedStop;
    }
    
    @Data
    public static class SkippedRecord {
        private Integer rowNumber;
        private String reason;
        private String stopIdentifier; // Name or ID that was being processed
        private String details;
    }
    
    @Data
    public static class ErrorRecord {
        private Integer rowNumber;
        private String errorType;
        private String errorMessage;
        private String stopIdentifier;
        private List<String> csvData; // The actual CSV row data for debugging
    }
    
    @Data
    public static class UpdateMetadata {
        private LocalDateTime processedAt;
        private String processedBy;
        private String fileName;
        private Long fileSize;
        private String updateStrategy;
        private String matchingStrategy;
        private Boolean partialUpdate;
        private Boolean createMissing;
        private Long processingTimeMs;
    }
}