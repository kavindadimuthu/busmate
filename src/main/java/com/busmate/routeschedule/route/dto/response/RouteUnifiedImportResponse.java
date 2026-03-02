package com.busmate.routeschedule.route.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class RouteUnifiedImportResponse {
    private Integer totalRecords;
    private Integer successfulImports;
    private Integer failedImports;
    private Integer skippedRecords;
    private List<ImportError> errors;
    private List<ImportWarning> warnings;
    private String message;
    
    // Summary of what was created
    private ImportSummary summary;
    
    @Data
    public static class ImportError {
        private Integer rowNumber;
        private String field;
        private String value;
        private String errorMessage;
        private String suggestion;
        private String rawCsvRow;
    }
    
    @Data
    public static class ImportWarning {
        private Integer rowNumber;
        private String field;
        private String warningMessage;
        private String action; // "CREATED", "UPDATED", "SKIPPED"
        private String details;
    }
    
    @Data
    public static class ImportSummary {
        private Integer routeGroupsCreated;
        private Integer routeGroupsReused;
        private Integer routesCreated;
        private Integer routeStopsCreated;
        private LocalDateTime processedAt;
        private String processedBy;
        
        // Details of created entities
        private List<CreatedEntity> createdRouteGroups;
        private List<CreatedEntity> createdRoutes;
        
        @Data
        public static class CreatedEntity {
            private UUID id;
            private String name;
            private Integer rowNumber;
        }
    }
}