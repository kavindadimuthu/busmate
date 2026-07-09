package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.entity.Cash;
import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.exception.NotFoundException;
import com.busmate.ticketing_service.repository.ConductorLogRepo;
import com.busmate.ticketing_service.repository.OnlineRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.busmate.ticketing_service.repository.TransactionsRepo;
import com.busmate.ticketing_service.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentServiceIMPL implements PaymentService {

    @Autowired
    private TicketRepo ticketRepo;

    @Autowired
    private ConductorLogRepo conductorLogRepo;

    @Autowired
    private TransactionsRepo transactionsRepo;

    @Autowired
    private OnlineRepo onlineRepo;

    @Override
    @Transactional
    public ConductorLogTicketDTO issueTicket(PaymentRequestDTO requestDTO) {
        try {
            // Create and save Transaction first
            Transactions transaction = new Transactions();
            transaction.setTotalAmount(requestDTO.getFareAmount().doubleValue());

            // Create ticket
            Tickets ticket = new Tickets();
            ticket.setConductorId(requestDTO.getConductorId());
            ticket.setBusId(requestDTO.getBusId());
            ticket.setTripId(requestDTO.getTripId());
            ticket.setStartLocationId(requestDTO.getStartLocationId());
            ticket.setEndLocationId(requestDTO.getEndLocationId());
            ticket.setFareAmount(requestDTO.getFareAmount());
            ticket.setIssuedAt(LocalDateTime.now());
            ticket.setSeatNumber(requestDTO.getSeatNumber());
            ticket.setPassengerId(requestDTO.getPassengerId());

            if ("CASH".equalsIgnoreCase(requestDTO.getPaymentMethod())) {
                // Set transaction details for cash payment
                transaction.setPaymentMethod(Transactions.Method.CASH);
                transaction.setStatus(Transactions.Status.COMPLETED);

                // Save transaction first
                Transactions savedTransaction = transactionsRepo.save(transaction);

                // Create and save cash payment record
                Cash cashPayment = new Cash();
                cashPayment.setConductorId(requestDTO.getConductorId());
                cashPayment.setAction(Cash.Action.ISSUED);
                cashPayment.setTransactions(savedTransaction);
                conductorLogRepo.save(cashPayment);

                // Set ticket details
                ticket.setStatus(Tickets.Status.VALID);
                ticket.setIssueMethod(Tickets.IssueMethod.CONDUCTOR);
                ticket.setTransactions(savedTransaction);

            } else {
                // Handle online payment
                transaction.setPaymentMethod(Transactions.Method.ONLINE);
                transaction.setStatus(Transactions.Status.PENDING);

                // Save transaction first
                Transactions savedTransaction = transactionsRepo.save(transaction);

                // Create and save online payment record
                Online onlinePayment = new Online();
                onlinePayment.setAmount(requestDTO.getFareAmount());
                onlinePayment.setMethod(Online.Method.PAYHERE); // Default to PAYHERE, could be made configurable
                onlinePayment.setStatus(Online.Status.PENDING);
                onlinePayment.setTransactionRef(requestDTO.getTransactionRef());
                onlinePayment.setCreatedAt(LocalDateTime.now());
                onlinePayment.setTransactions(savedTransaction);
                onlinePayment.setPassengerId(requestDTO.getPassengerId());
                onlineRepo.save(onlinePayment);

                // Set ticket details
                ticket.setStatus(Tickets.Status.NOT_VALID); // Will be valid once payment is confirmed
                ticket.setIssueMethod(Tickets.IssueMethod.ONLINE);
                ticket.setTransactions(savedTransaction);
            }

            // Save ticket and get the saved instance with ID
            Tickets savedTicket = ticketRepo.save(ticket);

            // Convert saved ticket to DTO for response
            return toDto(savedTicket);

        } catch (Exception e) {
            throw new BadRequestException("Failed to issue ticket: " + e.getMessage());
        }
    }

    @Override
    public List<ConductorLogTicketDTO> getConductorLogDetails(String conductorId) {
        try {
            // Fetch all tickets for the given conductor
            List<Tickets> tickets = ticketRepo.findByConductorId(conductorId);

            // Convert tickets to DTOs
            return tickets.stream().map(this::toDto).toList();

        } catch (Exception e) {
            // Return empty list in case of error
            return List.of();
        }
    }

    @Override
    public List<ConductorLogTicketDTO> getTicketDetailsByBusId(String busId) {
        try {
            // Fetch all tickets for the given bus ID
            List<Tickets> tickets = ticketRepo.findByBusId(busId);

            // Convert tickets to DTOs
            return tickets.stream().map(this::toDto).toList();

        } catch (Exception e) {
            // Return empty list in case of error
            return List.of();
        }
    }

    @Override
    public List<ConductorLogTicketDTO> getTicketDetailsByTripId(String tripId) {
        try {
            // Fetch all tickets for the given trip ID
            List<Tickets> tickets = ticketRepo.findByTripId(tripId);

            if (tickets.isEmpty()) {
                throw new NotFoundException("No tickets found for tripId: " + tripId);
            }

            // Convert tickets to DTOs
            return tickets.stream().map(this::toDto).toList();

        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to fetch tickets for tripId: " + tripId + ", " + e.getMessage());
        }
    }

    @Override
    public TripSummaryDTO getTripSummary(String tripId) {
        try {
            // Fetch all tickets for the given trip ID
            List<Tickets> tickets = ticketRepo.findByTripId(tripId);

            if (tickets.isEmpty()) {
                // Return empty summary if no tickets found
                return new TripSummaryDTO(tripId, 0, java.math.BigDecimal.ZERO, 0, 0, java.math.BigDecimal.ZERO);
            }

            // Calculate summary statistics
            int totalTickets = tickets.size();
            java.math.BigDecimal totalFareAmount = tickets.stream()
                    .map(Tickets::getFareAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            // Count valid and invalid tickets
            long validTickets = tickets.stream()
                    .filter(ticket -> ticket.getStatus() == Tickets.Status.VALID)
                    .count();
            int invalidTickets = totalTickets - (int) validTickets;

            // Calculate average fare per ticket
            java.math.BigDecimal averageFarePerTicket = totalTickets > 0
                    ? totalFareAmount.divide(java.math.BigDecimal.valueOf(totalTickets), 2,
                            java.math.RoundingMode.HALF_UP)
                    : java.math.BigDecimal.ZERO;

            return new TripSummaryDTO(
                    tripId,
                    totalTickets,
                    totalFareAmount,
                    (int) validTickets,
                    invalidTickets,
                    averageFarePerTicket);

        } catch (Exception e) {
            // Return empty summary in case of error
            return new TripSummaryDTO(tripId, 0, java.math.BigDecimal.ZERO, 0, 0, java.math.BigDecimal.ZERO);
        }
    }

    @Override
    public List<ConductorLogTicketDTO> getTicketDetailsByPassengerId(String passengerId) {
        try {
            // Fetch all tickets for the given passenger ID
            List<Tickets> tickets = ticketRepo.findByPassengerId(passengerId);

            if (tickets.isEmpty()) {
                throw new NotFoundException("No tickets found for passengerId: " + passengerId);
            }

            // Convert tickets to DTOs
            return tickets.stream().map(this::toDto).toList();

        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException(
                    "Failed to fetch tickets for passengerId: " + passengerId + ", " + e.getMessage());
        }
    }

    @Override
    public String validateTicket(TicketValidationRequestDTO requestDTO) {
        try {
            // Find the ticket by ID
            Tickets ticket = ticketRepo.findById(requestDTO.getTicketId())
                    .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + requestDTO.getTicketId()));

            // Check if ticket is already validated
            if (ticket.getStatus() == Tickets.Status.VALID) {
                throw new BadRequestException("Ticket is already validated");
            }

            // Update ticket status to VALID
            ticket.setStatus(Tickets.Status.VALID);

            // Save the updated ticket
            ticketRepo.save(ticket);

            return "Ticket validated successfully by conductor: " + requestDTO.getConductorId();

        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to validate ticket: " + e.getMessage());
        }
    }

    @Override
    public ConductorLogTicketDTO getTicketDetailsById(Long ticketId) {
        try {
            // Find the ticket by ID
            Tickets ticket = ticketRepo.findById(ticketId)
                    .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + ticketId));

            // Convert ticket to DTO
            return toDto(ticket);

        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to fetch ticket with ID: " + ticketId + ", " + e.getMessage());
        }
    }

    /**
     * Single source of truth for Tickets -> ConductorLogTicketDTO. Exposes the issue method
     * (CONDUCTOR/ONLINE) and validation status (VALID/NOT_VALID) as distinct, authoritative
     * fields so the conductor app can render booked-vs-validated and cash-vs-online correctly.
     * Previously each read method mapped inline and overloaded `paymentStatus` differently
     * (getTicketDetailsByTripId in particular put the issue method there while the seat-map UI
     * expected a validation flag), which is why validated seats never showed.
     */
    private ConductorLogTicketDTO toDto(Tickets ticket) {
        ConductorLogTicketDTO dto = new ConductorLogTicketDTO();
        dto.setTicketId(ticket.getTicketId());
        dto.setPassengerId(ticket.getPassengerId());
        dto.setStartLocationId(ticket.getStartLocationId());
        dto.setEndLocationId(ticket.getEndLocationId());
        dto.setSeatNumber(ticket.getSeatNumber());
        dto.setFareAmount(ticket.getFareAmount() != null ? ticket.getFareAmount().doubleValue() : 0.0);
        dto.setIssuedAt(ticket.getIssuedAt());
        dto.setIssueMethod(ticket.getIssueMethod() != null ? ticket.getIssueMethod().toString() : null);
        dto.setValidationStatus(ticket.getStatus() != null ? ticket.getStatus().toString() : null);
        // Backward-compat: keep paymentStatus carrying the issue method (CONDUCTOR/ONLINE),
        // which the trip-summary path historically keyed off.
        dto.setPaymentStatus(ticket.getIssueMethod() != null ? ticket.getIssueMethod().toString() : "UNKNOWN");
        dto.setPassengerCount(1);
        return dto;
    }
}
