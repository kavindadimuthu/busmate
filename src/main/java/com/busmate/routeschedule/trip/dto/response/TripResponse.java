package com.busmate.routeschedule.trip.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class TripResponse {
    private UUID id;
    private UUID passengerServicePermitId;
    private String passengerServicePermitNumber;
    
    // Additional IDs for easy querying
    private UUID scheduleId;
    private UUID routeId;
    private UUID permitId;
    private UUID operatorId;
    private UUID routeGroupId;
    
    // Descriptive fields
    private String permitNumber;
    private String scheduleName;
    private String routeName;
    private String operatorName;
    private String routeGroupName;
    
    private LocalDate tripDate;
    
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "02:50:00")
    private LocalTime scheduledDepartureTime;
    
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "06:30:00")
    private LocalTime actualDepartureTime;
    
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "05:20:00")
    private LocalTime scheduledArrivalTime;
    
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "09:40:00")
    private LocalTime actualArrivalTime;
    
    private UUID busId;
    private String busPlateNumber;
    private String busModel;
    private UUID driverId;
    private UUID conductorId;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}