package com.busmate.routeschedule.fleet.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OperatorImportRequest {
    @NotBlank(message = "Name is mandatory")
    private String name;
    
    private String operatorType;
    private String region;
    private String status;
    
    // Constructor for CSV parsing
    public OperatorImportRequest(String name, String operatorType, String region, String status) {
        this.name = name;
        this.operatorType = operatorType;
        this.region = region;
        this.status = status;
    }
    
    // Default constructor
    public OperatorImportRequest() {}
}