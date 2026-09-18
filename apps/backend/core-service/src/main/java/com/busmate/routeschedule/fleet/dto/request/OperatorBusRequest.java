package com.busmate.routeschedule.fleet.dto.request;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * A bus as an operator registers or edits it (INC-018). No operator id — the bus is the caller's —
 * and no status: registration status is MOT's to change (and the operator's to retire).
 */
@Data
public class OperatorBusRequest {
    @NotBlank(message = "NTC registration number is mandatory")
    @Size(max = 64)
    private String ntcRegistrationNumber;

    @NotBlank(message = "Plate number is mandatory")
    @Size(max = 32)
    private String plateNumber;

    @NotNull(message = "Capacity is mandatory")
    @Positive(message = "Capacity must be positive")
    @Max(value = 120, message = "Capacity cannot exceed 120 seats")
    private Integer capacity;

    @Size(max = 120)
    private String model;

    /** Fare tier (ServiceClassEnum). */
    @NotBlank(message = "Service class is mandatory")
    private String serviceClass;

    /** { facilityKey: true|false } */
    private JsonNode facilities;

    /** See SeatLayoutValidator for the shape; omitted = default 2+2 from capacity. */
    private JsonNode seatLayout;

    @Min(value = 1950, message = "Manufacture year looks wrong")
    @Max(value = 2100, message = "Manufacture year looks wrong")
    private Integer manufactureYear;

    @Size(max = 64)
    private String chassisNumber;

    @Size(max = 64)
    private String engineNumber;

    public BusRequest toBusRequest(UUID operatorId, String status) {
        BusRequest request = new BusRequest();
        request.setOperatorId(operatorId);
        request.setStatus(status);
        request.setNtcRegistrationNumber(ntcRegistrationNumber);
        request.setPlateNumber(plateNumber);
        request.setCapacity(capacity);
        request.setModel(model);
        request.setServiceClass(serviceClass);
        request.setFacilities(facilities);
        request.setSeatLayout(seatLayout);
        request.setManufactureYear(manufactureYear);
        request.setChassisNumber(chassisNumber);
        request.setEngineNumber(engineNumber);
        return request;
    }
}
