package com.busmate.routeschedule.operator.dto.response;

import lombok.Data;
import java.util.Map;

@Data
public class OperatorStatisticsResponse {
    private Long totalOperators;
    private Long activeOperators;
    private Long inactiveOperators;
    private Long pendingOperators;
    private Long cancelledOperators;
    private Long privateOperators;
    private Long ctbOperators;
    private Map<String, Long> operatorsByRegion;
    private Map<String, Long> operatorsByType;
    private Map<String, Long> operatorsByStatus;
    private Double averageOperatorsPerRegion;
    private String mostActiveRegion;
    private String leastActiveRegion;
    private Double activeOperatorPercentage;
}