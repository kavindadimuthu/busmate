package com.busmate.ticketing_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketValidationRequestDTO {
    private Long ticketId;
    private String conductorId;
}
