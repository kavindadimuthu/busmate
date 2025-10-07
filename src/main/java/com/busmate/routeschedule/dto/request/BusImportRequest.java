package com.busmate.routeschedule.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class BusImportRequest {
    @NotBlank(message = "Operator name is mandatory")
    private String operatorName;
    
    @NotBlank(message = "NTC registration number is mandatory")
    private String ntcRegistrationNumber;
    
    @NotBlank(message = "Plate number is mandatory")
    private String plateNumber;
    
    private Integer capacity;
    private String model;
    private String facilities;
    private String status;
    
    // Constructor for CSV parsing
    public BusImportRequest(String operatorName, String ntcRegistrationNumber, String plateNumber, 
                           Integer capacity, String model, String facilities, String status) {
        this.operatorName = operatorName;
        this.ntcRegistrationNumber = ntcRegistrationNumber;
        this.plateNumber = plateNumber;
        this.capacity = capacity;
        this.model = model;
        this.facilities = facilities;
        this.status = status;
    }
    
    // Default constructor
    public BusImportRequest() {}
}