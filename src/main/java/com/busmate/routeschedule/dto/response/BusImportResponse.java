package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class BusImportResponse {
    private Integer totalRecords;
    private Integer successfulImports;
    private Integer failedImports;
    private List<ImportError> errors;
    private String message;
    
    @Data
    public static class ImportError {
        private Integer rowNumber;
        private String field;
        private String value;
        private String errorMessage;
        private String suggestion;
    }
}