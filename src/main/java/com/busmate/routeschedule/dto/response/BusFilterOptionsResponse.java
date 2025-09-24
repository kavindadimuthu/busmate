package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class BusFilterOptionsResponse {
    private List<String> statuses;
    private List<OperatorOption> operators;
    private List<String> models;
    private List<String> capacityRanges;
    private List<String> sortOptions;
    private Map<String, Integer> capacityRange;
    
    @Data
    public static class OperatorOption {
        private String id;
        private String name;
        private String type;
    }
}