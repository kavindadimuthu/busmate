package com.busmate.routeschedule.dto.response.dashboard;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DashboardAlertsResponse {
    private List<SystemAlert> criticalAlerts;
    private List<SystemAlert> warningAlerts;
    private List<SystemAlert> informationalAlerts;
    private Integer totalCriticalAlerts;
    private Integer totalWarningAlerts;
    private Integer totalInformationalAlerts;
    private LocalDateTime lastAlertTime;
    
    @Data
    public static class SystemAlert {
        private String id;
        private String type; // "CRITICAL", "WARNING", "INFO"
        private String category; // "OPERATIONAL", "FLEET", "SCHEDULE", "PERMIT", "SYSTEM"
        private String title;
        private String message;
        private String severity; // "HIGH", "MEDIUM", "LOW"
        private LocalDateTime timestamp;
        private String entityType; // "BUS", "ROUTE", "TRIP", "OPERATOR", "PERMIT"
        private String entityId;
        private String actionRequired;
        private Boolean isResolved;
        private String source; // which service generated this alert
    }
}