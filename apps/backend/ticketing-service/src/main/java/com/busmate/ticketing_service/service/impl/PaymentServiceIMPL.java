package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.request.BookingRequestDTO;
import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketCancelRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.BookingResponseDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.PaymentConfirmResponseDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.entity.Cash;
import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.exception.NotFoundException;
import com.busmate.ticketing_service.payment.PaymentGateway;
import com.busmate.ticketing_service.repository.ConductorLogRepo;
import com.busmate.ticketing_service.repository.OnlineRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.busmate.ticketing_service.repository.TransactionsRepo;
import com.busmate.ticketing_service.service.PaymentService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceIMPL implements PaymentService {

    private final TicketRepo ticketRepo;
    private final ConductorLogRepo conductorLogRepo;
    private final TransactionsRepo transactionsRepo;
    private final OnlineRepo onlineRepo;
    private final PaymentGateway paymentGateway;

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
    @Transactional
    public BookingResponseDTO bookTicket(BookingRequestDTO requestDTO) {
        if (requestDTO.getFareAmount() == null || requestDTO.getFareAmount().signum() <= 0) {
            throw new BadRequestException("fareAmount must be positive");
        }
        if (requestDTO.getBusId() == null || requestDTO.getTripId() == null || requestDTO.getPassengerId() == null) {
            throw new BadRequestException("busId, tripId and passengerId are mandatory");
        }

        // Passenger self-booking is always an online payment - create the transaction/ticket in
        // PENDING state, then hand off to the payment gateway to start the payment. Mirrors
        // issueTicket()'s online branch but goes through PaymentGateway instead of trusting a
        // client-supplied transactionRef.
        Transactions transaction = new Transactions();
        transaction.setTotalAmount(requestDTO.getFareAmount().doubleValue());
        transaction.setPaymentMethod(Transactions.Method.ONLINE);
        transaction.setStatus(Transactions.Status.PENDING);
        Transactions savedTransaction = transactionsRepo.save(transaction);

        Tickets ticket = new Tickets();
        ticket.setBusId(requestDTO.getBusId());
        ticket.setTripId(requestDTO.getTripId());
        ticket.setPassengerId(requestDTO.getPassengerId());
        ticket.setStartLocationId(requestDTO.getStartLocationId());
        ticket.setEndLocationId(requestDTO.getEndLocationId());
        ticket.setSeatNumber(requestDTO.getSeatNumber());
        ticket.setFareAmount(requestDTO.getFareAmount());
        ticket.setIssuedAt(LocalDateTime.now());
        ticket.setStatus(Tickets.Status.NOT_VALID);
        ticket.setIssueMethod(Tickets.IssueMethod.ONLINE);
        ticket.setTransactions(savedTransaction);
        Tickets savedTicket = ticketRepo.save(ticket);

        PaymentGateway.PaymentInitiationResult initResult = paymentGateway.initiate(
                new PaymentGateway.PaymentInitiationRequest(
                        "TICKET-" + savedTicket.getTicketId(),
                        requestDTO.getFareAmount(),
                        requestDTO.getPassengerId(),
                        "BusMate ticket " + requestDTO.getBusId() + "/" + requestDTO.getTripId()));

        Online onlinePayment = new Online();
        onlinePayment.setPassengerId(requestDTO.getPassengerId());
        onlinePayment.setAmount(requestDTO.getFareAmount());
        // Online.Method's DB check constraint only allows PAYHERE/CASH/CARD - reuse PAYHERE as
        // the placeholder until a real gateway is wired (matches the existing issueTicket()
        // online branch's convention); the actual gateway used is recorded in transactionRef's
        // "DUMMY-..." prefix and by which PaymentGateway bean is active.
        onlinePayment.setMethod(Online.Method.PAYHERE);
        onlinePayment.setStatus(toOnlineStatus(initResult.status()));
        onlinePayment.setTransactionRef(initResult.gatewayReference());
        onlinePayment.setCreatedAt(LocalDateTime.now());
        onlinePayment.setTransactions(savedTransaction);
        onlineRepo.save(onlinePayment);

        return new BookingResponseDTO(
                savedTicket.getTicketId(),
                initResult.gatewayReference(),
                initResult.status().name(),
                initResult.redirectUrl(),
                requestDTO.getFareAmount());
    }

    @Override
    @Transactional
    public PaymentConfirmResponseDTO confirmPayment(Long ticketId) {
        Tickets ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + ticketId));

        Transactions transaction = ticket.getTransactions();
        if (transaction == null || transaction.getOnline() == null) {
            throw new BadRequestException("Ticket " + ticketId + " has no pending online payment");
        }
        Online online = transaction.getOnline();

        if (online.getStatus() == Online.Status.SUCCESS) {
            // Already confirmed - idempotent.
            return new PaymentConfirmResponseDTO(ticketId, "SUCCESS", true);
        }

        PaymentGateway.PaymentConfirmationResult result = paymentGateway.confirm(online.getTransactionRef());

        online.setStatus(toOnlineStatus(result.status()));
        online.setUpdatedAt(LocalDateTime.now());
        onlineRepo.save(online);

        transaction.setStatus(result.status() == PaymentGateway.PaymentStatus.SUCCESS
                ? Transactions.Status.COMPLETED
                : Transactions.Status.FAILED);
        transactionsRepo.save(transaction);

        // Note: ticket.status stays NOT_VALID even on payment success - it only becomes VALID
        // when a conductor validates it at boarding (see validateTicket()). Payment success is
        // reflected via transactionStatus/bookingStatus on the DTO, not the boarding flag.

        boolean confirmed = result.status() == PaymentGateway.PaymentStatus.SUCCESS;
        return new PaymentConfirmResponseDTO(ticketId, result.status().name(), confirmed);
    }

    @Override
    @Transactional
    public ConductorLogTicketDTO cancelTicket(Long ticketId, TicketCancelRequestDTO requestDTO) {
        Tickets ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + ticketId));

        if (requestDTO.getPassengerId() != null
                && !requestDTO.getPassengerId().equals(ticket.getPassengerId())) {
            throw new BadRequestException("This ticket does not belong to the given passenger");
        }
        if (ticket.getStatus() == Tickets.Status.CANCELLED) {
            throw new BadRequestException("Ticket is already cancelled");
        }
        if (ticket.getStatus() == Tickets.Status.VALID) {
            throw new BadRequestException("Cannot cancel a ticket that has already been validated/boarded");
        }

        ticket.setStatus(Tickets.Status.CANCELLED);

        // No real refund processing (dummy gateway) - just reflect that money already taken is
        // no longer owed, so admin views don't show a cancelled ticket as still COMPLETED.
        Transactions transaction = ticket.getTransactions();
        if (transaction != null) {
            if (transaction.getStatus() == Transactions.Status.COMPLETED) {
                transaction.setStatus(Transactions.Status.REFUNDED);
                transactionsRepo.save(transaction);
            }
            if (transaction.getOnline() != null && transaction.getOnline().getStatus() == Online.Status.SUCCESS) {
                Online online = transaction.getOnline();
                online.setStatus(Online.Status.REFUNDED);
                onlineRepo.save(online);
            }
        }

        Tickets saved = ticketRepo.save(ticket);
        return toDto(saved);
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
            if (ticket.getStatus() == Tickets.Status.CANCELLED) {
                throw new BadRequestException("Ticket has been cancelled");
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

    @Override
    public Page<ConductorLogTicketDTO> getAllTicketsWithFilters(
            List<String> busIds,
            String tripId,
            String conductorId,
            String passengerId,
            String issueMethod,
            String validationStatus,
            LocalDate dateFrom,
            LocalDate dateTo,
            String search,
            Pageable pageable) {

        Specification<Tickets> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (busIds != null && !busIds.isEmpty()) {
                predicates.add(root.get("busId").in(busIds));
            }
            if (tripId != null && !tripId.isBlank()) {
                predicates.add(cb.equal(root.get("tripId"), tripId));
            }
            if (conductorId != null && !conductorId.isBlank()) {
                predicates.add(cb.equal(root.get("conductorId"), conductorId));
            }
            if (passengerId != null && !passengerId.isBlank()) {
                predicates.add(cb.equal(root.get("passengerId"), passengerId));
            }
            if (issueMethod != null && !issueMethod.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("issueMethod"), Tickets.IssueMethod.valueOf(issueMethod.toUpperCase())));
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid issueMethod: " + issueMethod);
                }
            }
            if (validationStatus != null && !validationStatus.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("status"), Tickets.Status.valueOf(validationStatus.toUpperCase())));
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid validationStatus: " + validationStatus);
                }
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("issuedAt"), dateFrom.atStartOfDay()));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("issuedAt"), LocalDateTime.of(dateTo, LocalTime.MAX)));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("passengerId")), pattern),
                        cb.like(cb.lower(root.get("seatNumber")), pattern),
                        cb.like(cb.lower(root.get("busId")), pattern),
                        cb.like(cb.lower(root.get("tripId")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return ticketRepo.findAll(spec, pageable).map(this::toDto);
    }

    private Online.Status toOnlineStatus(PaymentGateway.PaymentStatus status) {
        return switch (status) {
            case SUCCESS -> Online.Status.SUCCESS;
            case FAILED -> Online.Status.FAILED;
            case PENDING -> Online.Status.PENDING;
        };
    }

    /**
     * Single source of truth for Tickets -> ConductorLogTicketDTO. Exposes the issue method
     * (CONDUCTOR/ONLINE), validation status (VALID/NOT_VALID/CANCELLED), transaction-level
     * payment status, and a derived human-friendly bookingStatus so callers (admin listing,
     * passenger "my tickets") don't have to reconstruct the state machine themselves.
     */
    private ConductorLogTicketDTO toDto(Tickets ticket) {
        ConductorLogTicketDTO dto = new ConductorLogTicketDTO();
        dto.setTicketId(ticket.getTicketId());
        dto.setBusId(ticket.getBusId());
        dto.setTripId(ticket.getTripId());
        dto.setConductorId(ticket.getConductorId());
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

        Transactions transaction = ticket.getTransactions();
        Transactions.Status txStatus = transaction != null ? transaction.getStatus() : null;
        dto.setTransactionStatus(txStatus != null ? txStatus.toString() : null);
        dto.setBookingStatus(deriveBookingStatus(ticket, txStatus));

        return dto;
    }

    private String deriveBookingStatus(Tickets ticket, Transactions.Status txStatus) {
        if (ticket.getStatus() == Tickets.Status.CANCELLED) {
            return "CANCELLED";
        }
        boolean online = ticket.getIssueMethod() == Tickets.IssueMethod.ONLINE;
        if (online && txStatus == Transactions.Status.PENDING) {
            return "PENDING_PAYMENT";
        }
        if (online && txStatus == Transactions.Status.FAILED) {
            return "PAYMENT_FAILED";
        }
        if (ticket.getStatus() == Tickets.Status.VALID) {
            return "BOARDED";
        }
        return "CONFIRMED";
    }
}
