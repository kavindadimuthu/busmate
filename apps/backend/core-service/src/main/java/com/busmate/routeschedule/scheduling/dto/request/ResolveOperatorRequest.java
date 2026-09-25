package com.busmate.routeschedule.scheduling.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ResolveOperatorRequest(@NotNull(message = "Choose the operator") UUID operatorId) {
}
