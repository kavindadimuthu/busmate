package com.busmate.routeschedule.network.dto.response;

import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class RouteFilterOptionsResponse {
    private List<DirectionEnum> directions;
    private List<RoadTypeEnum> roadTypes;
    private List<Map<String, Object>> routeGroups;
    private RangeFilter distanceRange;
    private RangeFilter durationRange;
    
    // Additional metadata that might be useful for UI
    private FilterMetadata metadata;
    
    @Data
    public static class RangeFilter {
        private Double min;
        private Double max;
        private Double average;
        private Long count;
    }
    
    @Data
    public static class FilterMetadata {
        private Integer totalRoutes;
        private Integer totalRouteGroups;
        private Integer totalDirections;
        private Boolean hasDistanceData;
        private Boolean hasDurationData;
        private String dataSource;
    }
}