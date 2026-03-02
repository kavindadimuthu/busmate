package com.busmate.routeschedule.route.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class RouteExportResponse {
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
        private String exportMode;
        
        // Filter information that was applied
        private FilterSummary filtersApplied;
        
        // Export options that were used
        private ExportOptions optionsUsed;
    }
    
    @Data
    public static class FilterSummary {
        private Boolean exportedAll;
        private Integer specificRouteIds;
        private Integer routeGroupIds;
        private Integer startStopIds;
        private Integer endStopIds;
        private Integer travelsThroughStops;
        private List<String> directions;
        private List<String> roadTypes;
        private Double minDistanceKm;
        private Double maxDistanceKm;
        private Integer minDurationMinutes;
        private Integer maxDurationMinutes;
        private String searchText;
    }
    
    @Data
    public static class ExportOptions {
        private String exportMode;
        private Boolean includeMultiLanguageFields;
        private Boolean includeRouteGroupInfo;
        private Boolean includeAuditFields;
        private List<String> customFields;
    }
}