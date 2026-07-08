package com.busmate.routeschedule.network.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request for unified route import with flexible options")
public class RouteUnifiedImportRequest {
    
    @Schema(description = "Strategy for handling duplicate route groups", 
            allowableValues = {"SKIP", "REUSE", "CREATE_WITH_SUFFIX"})
    private RouteGroupDuplicateStrategy routeGroupDuplicateStrategy = RouteGroupDuplicateStrategy.REUSE;
    
    @Schema(description = "Strategy for handling duplicate routes within same route group", 
            allowableValues = {"SKIP", "UPDATE", "CREATE_WITH_SUFFIX"})
    private RouteDuplicateStrategy routeDuplicateStrategy = RouteDuplicateStrategy.SKIP;
    
    @Schema(description = "Whether to validate that start and end stops exist in the system")
    private Boolean validateStopsExist = true;
    
    @Schema(description = "Whether to create stops if they don't exist (requires stop information in CSV)")
    private Boolean createMissingStops = false;
    
    @Schema(description = "Whether to allow partial updates when some route stops fail")
    private Boolean allowPartialRouteStops = true;
    
    @Schema(description = "Whether to validate geographical coordinates if provided")
    private Boolean validateCoordinates = false;
    
    @Schema(description = "Whether to continue processing when encountering errors in individual rows")
    private Boolean continueOnError = true;
    
    @Schema(description = "Default road type to use if not specified in CSV", 
            allowableValues = {"NORMALWAY", "EXPRESSWAY"})
    private String defaultRoadType = "NORMALWAY";
    
    public enum RouteGroupDuplicateStrategy {
        SKIP,                // Skip the entire row if route group exists
        REUSE,              // Use existing route group
        CREATE_WITH_SUFFIX  // Create new route group with suffix
    }
    
    public enum RouteDuplicateStrategy {
        SKIP,               // Skip the route if it exists in the route group
        UPDATE,             // Update existing route with new data
        CREATE_WITH_SUFFIX  // Create new route with suffix
    }
}