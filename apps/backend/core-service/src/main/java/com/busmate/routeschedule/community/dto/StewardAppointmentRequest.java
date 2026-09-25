package com.busmate.routeschedule.community.dto;

import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

/** The corridors (route groups) a contributor is appointed to review in. Replaces any previous scope. */
public record StewardAppointmentRequest(
        @NotEmpty(message = "Choose at least one corridor") Set<UUID> routeGroupIds) {
}
