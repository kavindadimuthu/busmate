package com.busmate.routeschedule.network.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Schema(description = "Request for exporting routes with flexible filtering and format options")
public class RouteExportRequest {

    @Schema(description = "Export all routes (ignores other filters if true)", example = "false")
    private Boolean exportAll = false;

    @Schema(description = "Specific route IDs to export")
    private List<UUID> routeIds;

    @Schema(description = "Filter by route group IDs")
    private List<UUID> routeGroupIds;

    @Schema(description = "Filter by stops that routes travel through")
    private List<UUID> travelsThroughStopIds;

    @Schema(description = "Filter by start stop IDs")
    private List<UUID> startStopIds;

    @Schema(description = "Filter by end stop IDs") 
    private List<UUID> endStopIds;

    @Schema(description = "Filter by direction", allowableValues = {"UP", "DOWN"})
    private List<String> directions;

    @Schema(description = "Filter by road type", allowableValues = {"NORMALWAY", "EXPRESSWAY"})
    private List<String> roadTypes;

    @Schema(description = "Filter by minimum distance in kilometers")
    private Double minDistanceKm;

    @Schema(description = "Filter by maximum distance in kilometers")
    private Double maxDistanceKm;

    @Schema(description = "Filter by minimum estimated duration in minutes")
    private Integer minDurationMinutes;

    @Schema(description = "Filter by maximum estimated duration in minutes")
    private Integer maxDurationMinutes;

    @Schema(description = "Search text to filter routes by name, route number, or description in all languages")
    private String searchText;

    @Schema(description = "Export mode - determines CSV structure", allowableValues = {"ROUTE_ONLY", "ROUTE_WITH_ALL_STOPS"})
    private ExportMode exportMode = ExportMode.ROUTE_ONLY;

    @Schema(description = "Export format", allowableValues = {"CSV", "JSON"})
    private ExportFormat format = ExportFormat.CSV;

    @Schema(description = "Include multi-language fields (name_sinhala, name_tamil, etc.)")
    private Boolean includeMultiLanguageFields = true;

    @Schema(description = "Include route group information")
    private Boolean includeRouteGroupInfo = true;

    @Schema(description = "Include audit fields (created_at, updated_at, created_by, updated_by)")
    private Boolean includeAuditFields = false;

    @Schema(description = "Custom fields to include in export")
    private List<String> customFields;

    @Schema(description = "Available export modes")
    public enum ExportMode {
        @Schema(description = "One row per route with only start and end stops")
        ROUTE_ONLY,
        @Schema(description = "One row per stop (multiple rows per route including all intermediate stops)")
        ROUTE_WITH_ALL_STOPS
    }

    @Schema(description = "Available export formats")
    public enum ExportFormat {
        @Schema(description = "Comma-separated values format")
        CSV,
        @Schema(description = "JavaScript Object Notation format")
        JSON
    }
}