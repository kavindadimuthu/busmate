package com.busmate.routeschedule.stop.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class StopExportResponse {
    private String fileName;
    private String contentType;
    private byte[] content;
    
    // Export metadata
    private ExportMetadata metadata;
    
    @Data
    public static class ExportMetadata {
        private Integer totalRecordsFound;
        private Integer recordsExported;
        private LocalDateTime exportedAt;
        private String exportedBy;
        private String format;
        
        // Filter information that was applied
        private FilterSummary filtersApplied;
        
        // Export options that were used
        private ExportOptions optionsUsed;
    }
    
    @Data
    public static class FilterSummary {
        private Boolean exportedAll;
        private Integer specificStopIds;
        private List<String> cities;
        private List<String> states;
        private List<String> countries;
        private Boolean accessibilityFilter;
        private String searchText;
    }
    
    @Data
    public static class ExportOptions {
        private Boolean includeMultiLanguageFields;
        private Boolean includeLocationDetails;
        private Boolean includeTimestamps;
        private Boolean includeUserInfo;
        private List<String> customFields;
    }
}