package com.busmate.routeschedule.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
public class ScheduleImportRequest {
    private String name;
    private UUID routeId;
    private String scheduleType;
    private LocalDate effectiveStartDate;
    private LocalDate effectiveEndDate;
    private String status;
    private String description;
    
    // Calendar days
    private Boolean monday;
    private Boolean tuesday;
    private Boolean wednesday;
    private Boolean thursday;
    private Boolean friday;
    private Boolean saturday;
    private Boolean sunday;
    
    // Stop timings
    private List<StopTiming> stopTimings;
    
    @Data
    public static class StopTiming {
        private UUID stopId;
        private Integer stopOrder;
        private LocalTime arrivalTime;
        private LocalTime departureTime;
    }
}