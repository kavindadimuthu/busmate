package com.busmate.routeschedule.licensing.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PassengerServicePermitResponse {
    private UUID id;
    private UUID operatorId;
    private String operatorName;
    private UUID routeGroupId;
    private String routeGroupName;
    private String permitNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private Integer maximumBusAssigned;
    private String status;
    private String permitType;
    /** Why the permit is suspended (MOT) or withdrawn (operator); null while active. */
    private String statusReason;
    /** True when the permit's expiry date has passed, whatever its recorded status says. */
    private Boolean expired;
    /** Buses currently authorised to run under this permit. */
    private Long activeBusCount;
    /** Pending trips from today on that run under this permit; filled on single-permit reads. */
    private Long upcomingTripCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
