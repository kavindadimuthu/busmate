package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Which seats on a trip can't be booked (INC-068). Seat labels and nothing else: no ticket ids,
 * passenger ids, fares or payment state, so it is safe to show to any signed-in passenger choosing a seat.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OccupiedSeatsDTO {
    private String tripId;
    /** Distinct seat labels claimed by a live (non-cancelled) ticket, sorted. Empty for a trip nothing has been sold on. */
    private List<String> occupiedSeats;
}
