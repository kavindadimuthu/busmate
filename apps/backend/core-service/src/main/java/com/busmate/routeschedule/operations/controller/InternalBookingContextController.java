package com.busmate.routeschedule.operations.controller;

import com.busmate.routeschedule.operations.dto.internal.InternalBookingContextResponse;
import com.busmate.routeschedule.operations.service.InternalBookingContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Pricing and bookability facts for one journey on one trip, read by ticketing-service before it
 * prices a passenger booking (INC-011). Gated by InternalApiKeyFilter like the rest of
 * /internal/**, never routed through the API gateway, and never called by a browser — a passenger
 * sees this data through the public passenger query instead.
 */
@RestController
@RequestMapping("/internal/booking-context")
@RequiredArgsConstructor
public class InternalBookingContextController {

    private final InternalBookingContextService bookingContextService;

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<InternalBookingContextResponse> getBookingContext(
            @PathVariable UUID tripId,
            @RequestParam UUID fromStopId,
            @RequestParam UUID toStopId) {
        return ResponseEntity.ok(bookingContextService.getBookingContext(tripId, fromStopId, toStopId));
    }
}
