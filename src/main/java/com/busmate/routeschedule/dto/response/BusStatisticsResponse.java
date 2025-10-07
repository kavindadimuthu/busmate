package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.Map;

@Data
public class BusStatisticsResponse {
    private Long totalBuses;
    private Long activeBuses;
    private Long inactiveBuses;
    private Long pendingBuses;
    private Long cancelledBuses;
    private Long privateBuses;
    private Long ctbBuses;
    private Map<String, Long> busesByOperator;
    private Map<String, Long> busesByStatus;
    private Map<String, Long> busesByModel;
    private Map<String, Long> busesByCapacityRange;
    private Double averageCapacity;
    private Integer totalCapacity;
    private Integer minCapacity;
    private Integer maxCapacity;
    private String mostPopularModel;
    private String operatorWithMostBuses;
    private Double activeBusPercentage;
    private Double averageBusesPerOperator;
}