package com.busmate.routeschedule.licensing.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class PassengerServicePermitFilterOptionsResponse {
    private List<String> statuses;
    private List<String> permitTypes;
    private List<OperatorOption> operators;
    private List<RouteGroupOption> routeGroups;
    private List<String> sortOptions;
    
    @Data
    public static class OperatorOption {
        private String id;
        private String name;
        private String type;
        private String region;
    }
    
    @Data
    public static class RouteGroupOption {
        private String id;
        private String name;
        private String description;
    }
}