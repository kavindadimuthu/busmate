package com.busmate.routeschedule.stop.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class StopFilterOptionsResponse {
    private List<String> states;
    private List<String> cities;
    private List<Boolean> accessibilityStatuses;
    private List<String> countries;
    
    // Additional filter options that might be useful for UI
    private FilterMetadata metadata;
    
    @Data
    public static class FilterMetadata {
        private Integer totalStates;
        private Integer totalCities;
        private Integer totalCountries;
        private Boolean hasAccessibleStops;
        private Boolean hasNonAccessibleStops;
    }
}