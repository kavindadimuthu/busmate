package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SimpleStopImportResponse {
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
        private UUID id;
        private String name;
        private String originalStopId; // From CSV
        private Integer rowNumber;
    }
}