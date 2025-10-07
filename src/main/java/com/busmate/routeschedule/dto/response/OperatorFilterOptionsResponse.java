package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class OperatorFilterOptionsResponse {
    private List<String> operatorTypes;
    private List<String> regions;
    private List<String> statuses;
    private List<String> sortOptions;
}