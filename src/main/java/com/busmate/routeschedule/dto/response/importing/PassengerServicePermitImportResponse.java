package com.busmate.routeschedule.dto.response.importing;

import lombok.Data;
import java.util.List;

@Data
public class PassengerServicePermitImportResponse {
    private int totalRecords;
    private int successfulImports;
    private int failedImports;
    private List<ImportError> errors;
    private String message;
    
    @Data
    public static class ImportError {
        private int rowNumber;
        private String field;
        private String value;
        private String errorMessage;
        private String suggestion;
    }
}