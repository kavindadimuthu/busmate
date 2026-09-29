package com.busmate.routeschedule.scheduling.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ResolveBusRequest(@NotNull(message = "Choose the bus") UUID busId) {
}
