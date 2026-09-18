package com.busmate.routeschedule.operations.service;

import com.busmate.routeschedule.operations.dto.internal.InternalBookingContextResponse;

import java.util.UUID;

public interface InternalBookingContextService {

    InternalBookingContextResponse getBookingContext(UUID tripId, UUID fromStopId, UUID toStopId);
}
