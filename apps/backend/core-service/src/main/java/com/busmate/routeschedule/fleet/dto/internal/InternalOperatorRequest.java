package com.busmate.routeschedule.fleet.dto.internal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Payload sent by user-service's OperatorSyncClient to create/update the core-service
 * Operator linked to a user-service account. Field mapping (see the unified lifecycle
 * plan): name <- profileData.organization_name, operatorType <- profileData.operator_type,
 * region <- profileData.region, status <- derived from accountStatus.
 */
@Data
public class InternalOperatorRequest {

    @NotNull(message = "userId is mandatory")
    private UUID userId;

    @NotBlank(message = "Name is mandatory")
    private String name;

    private String operatorType = "PRIVATE";

    private String region;

    private String status = "active";
}
