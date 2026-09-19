package com.busmate.ticketing_service.service;

import com.busmate.ticketing_service.dto.request.BookingRequestDTO;
import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketCancelRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.BookingResponseDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.PaymentConfirmResponseDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.security.Caller;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    ConductorLogTicketDTO issueTicket(PaymentRequestDTO requestDTO);

    List<ConductorLogTicketDTO> getConductorLogDetails(String conductorId);

    List<ConductorLogTicketDTO> getTicketDetailsByBusId(String busId);

    List<ConductorLogTicketDTO> getTicketDetailsByTripId(String tripId);

    List<ConductorLogTicketDTO> getTicketDetailsByPassengerId(String passengerId, Caller caller);

    ConductorLogTicketDTO getTicketDetailsById(Long ticketId, Caller caller);

    TripSummaryDTO getTripSummary(String tripId);

    String validateTicket(TicketValidationRequestDTO requestDTO);

    /**
     * Books seats for the signed-in passenger. The caller decides which trip and which seats; this
     * service decides who the booking belongs to, what it costs, and whether the trip can be
     * booked at all (INC-011).
     */
    BookingResponseDTO bookTicket(BookingRequestDTO requestDTO, Caller caller);

    PaymentConfirmResponseDTO confirmPayment(Long ticketId, Caller caller);

    ConductorLogTicketDTO cancelTicket(Long ticketId, TicketCancelRequestDTO requestDTO, Caller caller);

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

    /**
     * The operator_id every ticket in the listing must match, or null for no restriction
     * (INC-021). Refuses (ForbiddenException) a caller who is neither staff nor a linked
     * operator, and an operator whose own operator link cannot be confirmed right now.
     */
    String resolveTicketListScope(com.busmate.ticketing_service.security.Caller caller);

    // Admin (operator/MOT) ticket listing - filterable, paginated
    Page<ConductorLogTicketDTO> getAllTicketsWithFilters(
            String operatorScope,
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
