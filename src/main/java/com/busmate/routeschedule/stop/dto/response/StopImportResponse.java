package com.busmate.routeschedule.stop.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class StopImportResponse {
    private Integer totalRecords;
    private Integer successfulImports;
    private Integer failedImports;
    private List<ImportError> errors;
    private String message;
    private List<ImportedStop> importedStops; // New field for imported stops with UUIDs
    
    @Data
    public static class ImportError {
        private Integer rowNumber;
        private String field;
        private String value;
        private String errorMessage;
        private String suggestion;
    }
    
    @Data
    public static class ImportedStop {
        private java.util.UUID id;
        private String name;
        private String originalStopId; // From CSV (if available)
        private Integer rowNumber;
    }
}