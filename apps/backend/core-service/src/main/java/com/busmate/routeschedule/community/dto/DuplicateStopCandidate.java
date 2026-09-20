package com.busmate.routeschedule.community.dto;

import java.util.UUID;

public record DuplicateStopCandidate(UUID stopId, String name, double distanceMeters) {
}
