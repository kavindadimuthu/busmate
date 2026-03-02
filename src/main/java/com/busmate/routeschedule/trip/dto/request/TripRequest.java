package com.busmate.routeschedule.trip.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import com.busmate.routeschedule.schedule.entity.Schedule;
import com.busmate.routeschedule.trip.entity.Trip;

@Data
public class TripRequest {
    @Schema(description = "Passenger Service Permit ID - Optional, can be assigned later")
    private UUID passengerServicePermitId;

    @NotNull(message = "Schedule ID is mandatory")
    private UUID scheduleId;

    @NotNull(message = "Trip date is mandatory")
    private LocalDate tripDate;

    @NotNull(message = "Scheduled departure time is mandatory")
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "02:50:00")
    private LocalTime scheduledDepartureTime;

    @NotNull(message = "Scheduled arrival time is mandatory")
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "05:20:00")
    private LocalTime scheduledArrivalTime;

    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "06:30:00")
    private LocalTime actualDepartureTime;

    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(type = "string", pattern = "HH:mm:ss", example = "09:40:00")
    private LocalTime actualArrivalTime;

    private UUID busId;

    private UUID driverId;

    private UUID conductorId;

    @Schema(allowableValues = {"pending", "active", "completed", "cancelled", "delayed", "in_transit", "boarding", "departed"})
    private String status = "pending";

    private String notes;
}