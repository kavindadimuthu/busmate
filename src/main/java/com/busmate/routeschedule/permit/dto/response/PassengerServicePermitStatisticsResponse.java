package com.busmate.routeschedule.permit.dto.response;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class PassengerServicePermitStatisticsResponse {
    private Long totalPermits;
    private Long activePermits;
    private Long pendingPermits;
    private Long inactivePermits;
    private Long cancelledPermits;
    private Long expiringSoonPermits; // Permits expiring within 30 days
    private Long expiredPermits;
    
    private Map<String, Long> permitsByType;
    private Map<String, Long> permitsByOperator;
    private Map<String, Long> permitsByRouteGroup;
    private Map<String, Long> permitsByStatus;
    
    private List<ExpiringPermit> expiringSoonList;
    
    @Data
    public static class ExpiringPermit {
        private String id;
        private String permitNumber;
        private String operatorName;
        private String routeGroupName;
        private String expiryDate;
        private int daysUntilExpiry;
    }
}