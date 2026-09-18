package com.busmate.routeschedule.fleet.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BusResponse {
    private UUID id;
    private UUID operatorId;
    private String operatorName;
    private String ntcRegistrationNumber;
    private String plateNumber;
    private Integer capacity;
    private String model;
    private JsonNode facilities;
    // Structured seat layout. Never null in responses — the service fills a default 2+2
    // layout derived from `capacity` when the bus has no explicit layout stored.
    private JsonNode seatLayout;
    /** Fare tier the bus is charged at — one of ServiceClassEnum. */
    private String serviceClass;
    private String status;
    /** Why MOT suspended or the operator retired the bus; null while active. */
    private String statusReason;
    private Integer manufactureYear;
    private String chassisNumber;
    private String engineNumber;
    /** AVAILABLE, UNDER_MAINTENANCE or OFF_ROAD (INC-018). */
    private String availability;
    private java.time.LocalDate availabilityFrom;
    private java.time.LocalDate availabilityUntil;
    private String availabilityNote;
    /** Active and available today: the bus can be put on today's trips. */
    private Boolean availableToday;
    /** The cover photo's media id, or null when the bus has no photos. */
    private UUID coverPhotoId;
    private Long photoCount;
    private Long documentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
