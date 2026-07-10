package com.busmate.ticketing_service.dto.request;

import lombok.Data;

@Data
public class TicketCancelRequestDTO {
    /** Ownership check - must match the ticket's passengerId. */
    private String passengerId;
    private String reason;
}
