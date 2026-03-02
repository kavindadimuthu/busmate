package com.busmate.routeschedule.stop.dto.response;

import lombok.Data;
import java.util.Map;

@Data
public class StopStatisticsResponse {
    private Long totalStops;
    private Long accessibleStops;
    private Long nonAccessibleStops;
    private Long stopsWithDescription;
    private Long stopsWithoutDescription;
    private Map<String, Long> stopsByState;
    private Map<String, Long> stopsByCity;
    private Map<String, Long> stopsByAccessibility;
    private Double averageStopsPerState;
    private Double averageStopsPerCity;
    private String mostPopulatedState;
    private String leastPopulatedState;
    private String mostPopulatedCity;
    private String leastPopulatedCity;
    private Double accessibleStopsPercentage;
    private Double nonAccessibleStopsPercentage;
    private Long totalStates;
    private Long totalCities;
}