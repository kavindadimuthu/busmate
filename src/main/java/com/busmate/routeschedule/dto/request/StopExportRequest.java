package com.busmate.routeschedule.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class StopExportRequest {

    // Export scope - if true, ignore other filters and export all stops
    private Boolean exportAll = false;

    // Specific stop IDs to export
    private List<UUID> stopIds;

    // Location-based filters
    private List<String> cities;
    private List<String> states;
    private List<String> countries;

    // Accessibility filter
    private Boolean isAccessible;

    // Search text filter (searches across name, address, city, state in all languages)
    private String searchText;

    // CSV export options
    private ExportFormat format = ExportFormat.CSV;
    private Boolean includeMultiLanguageFields = true;
    private Boolean includeLocationDetails = true;
    private Boolean includeTimestamps = false;
    private Boolean includeUserInfo = false;

    // Custom field selection (if null, export all based on above boolean flags)
    private List<String> customFields;

    public enum ExportFormat {
        CSV, JSON
    }
}