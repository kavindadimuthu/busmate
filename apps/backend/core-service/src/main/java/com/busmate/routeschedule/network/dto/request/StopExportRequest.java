package com.busmate.routeschedule.network.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Schema(description = "Request for exporting stops with flexible filtering and format options")
public class StopExportRequest {

    @Schema(description = "Export all stops (ignores other filters if true)", example = "false")
    private Boolean exportAll = false;

    @Schema(description = "Specific stop IDs to export (comma-separated list)")
    private List<UUID> stopIds;

    @Schema(description = "Filter by cities (comma-separated list)")
    private List<String> cities;
    
    @Schema(description = "Filter by states (comma-separated list)")
    private List<String> states;
    
    @Schema(description = "Filter by countries (comma-separated list)")
    private List<String> countries;

    @Schema(description = "Filter by accessibility status")
    private Boolean isAccessible;

    @Schema(description = "Search text to filter stops by name, address, city, or state in all languages")
    private String searchText;

    @Schema(description = "Export format", allowableValues = {"CSV", "JSON"})
    private ExportFormat format = ExportFormat.CSV;
    
    @Schema(description = "Include multi-language fields (name_sinhala, name_tamil, etc.)")
    private Boolean includeMultiLanguageFields = true;
    
    @Schema(description = "Include detailed location information (address, coordinates, etc.)")
    private Boolean includeLocationDetails = true;
    
    @Schema(description = "Include timestamp information (createdAt, updatedAt)")
    private Boolean includeTimestamps = false;
    
    @Schema(description = "Include user information (createdBy, updatedBy)")
    private Boolean includeUserInfo = false;

    @Schema(description = "Custom field selection (if specified, only these fields will be exported)")
    private List<String> customFields;

    @Schema(description = "Available export formats")
    public enum ExportFormat {
        @Schema(description = "Comma-separated values format")
        CSV,
        @Schema(description = "JavaScript Object Notation format")
        JSON
    }
}