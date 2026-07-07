package com.busmate.ticketing_service.service;

import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;

import java.util.List;

public interface PaymentService {
    ConductorLogTicketDTO issueTicket(PaymentRequestDTO requestDTO);

    List<ConductorLogTicketDTO> getConductorLogDetails(String conductorId);

    List<ConductorLogTicketDTO> getTicketDetailsByBusId(String busId);

    List<ConductorLogTicketDTO> getTicketDetailsByTripId(String tripId);

    List<ConductorLogTicketDTO> getTicketDetailsByPassengerId(String passengerId);

    ConductorLogTicketDTO getTicketDetailsById(Long ticketId);

    TripSummaryDTO getTripSummary(String tripId);

    String validateTicket(TicketValidationRequestDTO requestDTO);
}
