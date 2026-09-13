package com.busmate.ticketing_service.service;

import com.busmate.ticketing_service.dto.request.BookingRequestDTO;
import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketCancelRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.BookingResponseDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.PaymentConfirmResponseDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
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

    // Passenger self-service booking (always online, via PaymentGateway)
    BookingResponseDTO bookTicket(BookingRequestDTO requestDTO);

    PaymentConfirmResponseDTO confirmPayment(Long ticketId);

    ConductorLogTicketDTO cancelTicket(Long ticketId, TicketCancelRequestDTO requestDTO);

    /**
     * Reconciles a conductor-collected card payment (INC-008) against PayHere's own record of
     * it, driven by the notify_url webhook. The ticket was already issued optimistically when
     * the conductor's app reported success; this only corrects the Online/Transaction status if
     * PayHere's authoritative record disagrees - it never un-issues or invalidates the ticket,
     * since the passenger has already been handed a boarding-valid digital ticket.
     *
     * @param orderId    the transactionRef the app generated and sent as PayHere's order_id
     * @param statusCode PayHere's status_code (2=success, 0=pending, -1=cancelled, -2=failed, -3=chargedback)
     */
    void applyPayHereNotification(String orderId, int statusCode);

    // Admin (operator/MOT) ticket listing - filterable, paginated
    Page<ConductorLogTicketDTO> getAllTicketsWithFilters(
            List<String> busIds,
            String tripId,
            String conductorId,
            String passengerId,
            String issueMethod,
            String validationStatus,
            LocalDate dateFrom,
            LocalDate dateTo,
            String search,
            Pageable pageable);
}
