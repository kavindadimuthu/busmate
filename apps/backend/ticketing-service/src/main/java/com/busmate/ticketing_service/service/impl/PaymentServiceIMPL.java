package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.request.BookingRequestDTO;
import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketCancelRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.BookingResponseDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.PaymentBreakdownEntryDTO;
import com.busmate.ticketing_service.dto.response.PaymentConfirmResponseDTO;
import com.busmate.ticketing_service.dto.response.SaleStageBreakdownEntryDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.entity.Cash;
import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.exception.NotFoundException;
import com.busmate.ticketing_service.core.BookingContext;
import com.busmate.ticketing_service.core.CoreServiceClient;
import com.busmate.ticketing_service.fare.ServiceClass;
import com.busmate.ticketing_service.exception.ForbiddenException;
import com.busmate.ticketing_service.payment.PaymentGateway;
import com.busmate.ticketing_service.security.Caller;
import com.busmate.ticketing_service.service.RouteFareService;
import com.busmate.ticketing_service.payment.PaymentMethod;
import com.busmate.ticketing_service.sales.SaleChannel;
import com.busmate.ticketing_service.repository.ConductorLogRepo;
import com.busmate.ticketing_service.repository.OnlineRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.busmate.ticketing_service.repository.TransactionsRepo;
import com.busmate.ticketing_service.service.PaymentService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceIMPL implements PaymentService {

    private final TicketRepo ticketRepo;
    private final ConductorLogRepo conductorLogRepo;
    private final TransactionsRepo transactionsRepo;
    private final OnlineRepo onlineRepo;
    private final PaymentGateway paymentGateway;
    private final CoreServiceClient coreServiceClient;
    private final RouteFareService routeFareService;

    @Value("${booking.cutoff-minutes-before-departure:30}")
    private int cutoffMinutesBeforeDeparture;

    @Value("${booking.max-seats-per-booking:5}")
    private int maxSeatsPerBooking;

    /**
     * Trip states a seat can still be sold for. Everything else - departed, in transit, completed,
     * cancelled - is a bus the passenger cannot still board at their stop.
     */
    private static final java.util.Set<String> BOOKABLE_TRIP_STATUSES = java.util.Set.of("pending", "active");

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

            } else if ("CARD".equalsIgnoreCase(requestDTO.getPaymentMethod())) {
                // INC-008: conductor collected a card payment via PayHere's in-app SDK. By the
                // time this request arrives, PayHere's own popup has already returned SUCCESS to
                // the app (see PayHereController) - this is not a "pending online payment" the
                // way the ONLINE branch below is, so it's issued the same way CASH is: complete
                // and boarding-valid immediately, with the money already collected in person.
                //
                // Transactions.Method has no CARD value (its DB column is a 0/1 ordinal check
                // constraint - CASH=0, ONLINE=1 - adding one needs a migration, which is out of
                // scope here). ONLINE already means "detail lives in the online sub-table", which
                // is true here too; the actual method (CARD vs a real online redirect) is
                // recorded precisely by Online.Method below, which already supports CARD.
                transaction.setPaymentMethod(Transactions.Method.ONLINE);
                transaction.setStatus(Transactions.Status.COMPLETED);
                Transactions savedTransaction = transactionsRepo.save(transaction);

                Online cardPayment = new Online();
                cardPayment.setAmount(requestDTO.getFareAmount());
                cardPayment.setMethod(Online.Method.CARD);
                cardPayment.setStatus(Online.Status.SUCCESS);
                cardPayment.setTransactionRef(requestDTO.getTransactionRef());
                cardPayment.setCreatedAt(LocalDateTime.now());
                cardPayment.setTransactions(savedTransaction);
                cardPayment.setPassengerId(requestDTO.getPassengerId());
                onlineRepo.save(cardPayment);

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
    public BookingResponseDTO bookTicket(BookingRequestDTO requestDTO, Caller caller) {
        if (requestDTO.getTripId() == null || requestDTO.getTripId().isBlank()) {
            throw new BadRequestException("tripId is mandatory");
        }
        List<String> seats = requestedSeats(requestDTO);

        // Everything that decides the price and whether this is sellable comes from core-service,
        // which owns trips, routes and fleet. The request body gets no vote (INC-011).
        BookingContext context = coreServiceClient.getBookingContext(
                requestDTO.getTripId(), requestDTO.getStartLocationId(), requestDTO.getEndLocationId());

        requireBookable(context);

        BigDecimal farePerSeat = priceOf(context);
        BigDecimal total = farePerSeat.multiply(BigDecimal.valueOf(seats.size()));

        Transactions transaction = new Transactions();
        transaction.setTotalAmount(total.doubleValue());
        transaction.setPaymentMethod(Transactions.Method.ONLINE);
        transaction.setStatus(Transactions.Status.PENDING);
        Transactions savedTransaction = transactionsRepo.save(transaction);

        // One ticket per seat, all against the single transaction the passenger pays once for.
        List<Tickets> savedTickets = new ArrayList<>();
        for (String seat : seats) {
            Tickets ticket = new Tickets();
            ticket.setBusId(context.busId());
            ticket.setTripId(requestDTO.getTripId());
            ticket.setPassengerId(caller.userId());
            ticket.setStartLocationId(requestDTO.getStartLocationId());
            ticket.setEndLocationId(requestDTO.getEndLocationId());
            ticket.setSeatNumber(seat);
            ticket.setFareAmount(farePerSeat);
            ticket.setIssuedAt(LocalDateTime.now());
            ticket.setStatus(Tickets.Status.NOT_VALID);
            ticket.setIssueMethod(Tickets.IssueMethod.ONLINE);
            ticket.setTransactions(savedTransaction);
            savedTickets.add(ticketRepo.save(ticket));
        }

        Long firstTicketId = savedTickets.get(0).getTicketId();
        PaymentGateway.PaymentInitiationResult initResult = paymentGateway.initiate(
                new PaymentGateway.PaymentInitiationRequest(
                        "TICKET-" + firstTicketId,
                        total,
                        caller.userId(),
                        "BusMate ticket " + context.busId() + "/" + requestDTO.getTripId()));

        Online onlinePayment = new Online();
        onlinePayment.setPassengerId(caller.userId());
        onlinePayment.setAmount(total);
        onlinePayment.setMethod(Online.Method.PAYHERE);
        onlinePayment.setStatus(toOnlineStatus(initResult.status()));
        onlinePayment.setTransactionRef(initResult.gatewayReference());
        onlinePayment.setCreatedAt(LocalDateTime.now());
        onlinePayment.setTransactions(savedTransaction);
        onlineRepo.save(onlinePayment);

        return new BookingResponseDTO(
                firstTicketId,
                savedTickets.stream().map(Tickets::getTicketId).toList(),
                initResult.gatewayReference(),
                initResult.status().name(),
                initResult.redirectUrl(),
                farePerSeat,
                total);
    }

    /**
     * Seats as the caller asked for them. Duplicates are rejected rather than quietly collapsed:
     * a request for the same seat twice is a client bug, and silently charging for one seat while
     * the passenger believes they hold two is the worse failure.
     */
    private List<String> requestedSeats(BookingRequestDTO requestDTO) {
        List<String> seats = requestDTO.getSeatNumbers() != null && !requestDTO.getSeatNumbers().isEmpty()
                ? requestDTO.getSeatNumbers()
                : (requestDTO.getSeatNumber() != null ? List.of(requestDTO.getSeatNumber()) : List.of());

        List<String> cleaned = seats.stream()
                .filter(seat -> seat != null && !seat.isBlank())
                .map(String::trim)
                .toList();

        if (cleaned.isEmpty()) {
            throw new BadRequestException("Choose at least one seat");
        }
        if (cleaned.size() > maxSeatsPerBooking) {
            throw new BadRequestException("A single booking can hold at most " + maxSeatsPerBooking + " seats");
        }
        if (cleaned.stream().distinct().count() != cleaned.size()) {
            throw new BadRequestException("The same seat was requested more than once");
        }
        return cleaned;
    }

    /**
     * A trip is sellable only while it is still going to pick this passenger up: it has to exist in
     * a pre-departure state, have a bus (without one there is no seat map to sell against), and
     * still be more than the cutoff away from leaving the passenger's own boarding stop.
     */
    private void requireBookable(BookingContext context) {
        String status = context.tripStatus() == null ? "" : context.tripStatus().toLowerCase();
        if (!BOOKABLE_TRIP_STATUSES.contains(status)) {
            throw new BadRequestException("This trip can no longer be booked");
        }
        if (context.busId() == null) {
            throw new BadRequestException("No bus has been assigned to this trip yet, so seats cannot be booked");
        }
        if (context.tripDate() == null || context.scheduledDepartureFromBoardingStop() == null) {
            throw new BadRequestException("This trip has no departure time, so seats cannot be booked");
        }

        LocalDateTime departure = LocalDateTime.of(
                context.tripDate(), context.scheduledDepartureFromBoardingStop());
        if (LocalDateTime.now().isAfter(departure.minusMinutes(cutoffMinutesBeforeDeparture))) {
            throw new BadRequestException(
                    "Booking for this trip closed " + cutoffMinutesBeforeDeparture
                            + " minutes before it leaves your stop");
        }
    }

    /** The fare for one seat, from this service's own fare tables and core-service's facts. */
    private BigDecimal priceOf(BookingContext context) {
        if (context.boardingDistanceKm() == null || context.alightingDistanceKm() == null) {
            throw new BadRequestException("This route has no distances recorded, so a fare cannot be calculated");
        }
        ServiceClass serviceClass = ServiceClass.resolve(context.busServiceClass())
                .orElse(ServiceClass.NORMAL);

        return routeFareService.priceJourney(
                context.routeId(),
                context.boardingDistanceKm(),
                context.alightingDistanceKm(),
                serviceClass);
    }

    @Override
    @Transactional
    public PaymentConfirmResponseDTO confirmPayment(Long ticketId, Caller caller) {
        Tickets ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + ticketId));

        // Only the passenger who booked it may drive its payment - staff included, since nobody
        // else has any business completing someone's purchase.
        if (!caller.owns(ticket.getPassengerId())) {
            throw new ForbiddenException("This booking is not yours to pay for");
        }

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
    public void applyPayHereNotification(String orderId, int statusCode) {
        Online online = onlineRepo.findByTransactionRef(orderId).orElse(null);
        if (online == null) {
            // Either a stale/replayed notify, or one that arrived before issueTicket()'s save
            // committed. Nothing to reconcile against - log and move on rather than fail the
            // webhook (PayHere would just retry a 200 the same way).
            log.warn("[PayHere notify] no Online record for orderId {} - nothing to reconcile", orderId);
            return;
        }

        // status_code: 2=success, 0=pending, everything else is not a success (PayHere docs).
        Online.Status newStatus = statusCode == 2 ? Online.Status.SUCCESS : Online.Status.FAILED;

        if (online.getStatus() == newStatus) {
            return; // already consistent - nothing to do
        }

        if (online.getStatus() == Online.Status.SUCCESS && newStatus == Online.Status.FAILED) {
            // The ticket was already issued and handed to the passenger as boarding-valid on the
            // app's optimistic success callback. PayHere now disagrees after the fact (rare -
            // e.g. a late issuer decline). Flag the money side for finance reconciliation, but
            // deliberately do NOT touch ticket.status - a passenger who already boarded on a
            // shown digital ticket must not have it silently invalidated.
            log.warn("[PayHere notify] order {} was recorded SUCCESS but PayHere now reports "
                    + "statusCode={} - ticket stays valid, flagging transaction for manual review",
                    orderId, statusCode);
        }

        online.setStatus(newStatus);
        online.setUpdatedAt(LocalDateTime.now());
        onlineRepo.save(online);

        Transactions transaction = online.getTransactions();
        if (transaction != null) {
            transaction.setStatus(newStatus == Online.Status.SUCCESS
                    ? Transactions.Status.COMPLETED
                    : Transactions.Status.FAILED);
            transactionsRepo.save(transaction);
        }
    }

    @Override
    @Transactional
    public ConductorLogTicketDTO cancelTicket(Long ticketId, TicketCancelRequestDTO requestDTO, Caller caller) {
        Tickets ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + ticketId));

        // The passenger who booked it, or staff acting on their behalf. Before INC-011 the
        // passenger in the request body was checked only when the client chose to send one, so
        // omitting it cancelled anyone's ticket.
        caller.requireOwnershipOrStaff(ticket.getPassengerId());
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
                return new TripSummaryDTO(tripId, 0, java.math.BigDecimal.ZERO, 0, 0,
                        java.math.BigDecimal.ZERO, 0, List.of(), List.of());
            }

            // Cancelled tickets are refunded, so they are neither revenue nor carried passengers.
            // Every total below is computed from the same set buildPaymentBreakdown uses, which is
            // what keeps "Total Revenue" equal to the sum of its per-method rows.
            List<Tickets> active = tickets.stream()
                    .filter(ticket -> ticket.getStatus() != Tickets.Status.CANCELLED)
                    .toList();
            int cancelledTickets = tickets.size() - active.size();

            int totalTickets = active.size();
            java.math.BigDecimal totalFareAmount = active.stream()
                    .map(ticket -> ticket.getFareAmount() != null ? ticket.getFareAmount() : java.math.BigDecimal.ZERO)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            long validTickets = active.stream()
                    .filter(ticket -> ticket.getStatus() == Tickets.Status.VALID)
                    .count();
            int invalidTickets = totalTickets - (int) validTickets;

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
                    averageFarePerTicket,
                    cancelledTickets,
                    buildPaymentBreakdown(tickets),
                    buildSaleBreakdown(tickets));

        } catch (Exception e) {
            // Return empty summary in case of error
            return new TripSummaryDTO(tripId, 0, java.math.BigDecimal.ZERO, 0, 0,
                    java.math.BigDecimal.ZERO, 0, List.of(), List.of());
        }
    }

    @Override
    public List<ConductorLogTicketDTO> getTicketDetailsByPassengerId(String passengerId, Caller caller) {
        // A passenger may ask only for their own tickets; staff may ask for anyone's.
        caller.requireOwnershipOrStaff(passengerId);
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
    public ConductorLogTicketDTO getTicketDetailsById(Long ticketId, Caller caller) {
        try {
            // Find the ticket by ID
            Tickets ticket = ticketRepo.findById(ticketId)
                    .orElseThrow(() -> new NotFoundException("Ticket not found with ID: " + ticketId));

            caller.requireOwnershipOrStaff(ticket.getPassengerId());

            // Convert ticket to DTO
            return toDto(ticket);

        } catch (NotFoundException | ForbiddenException e) {
            // Rethrown explicitly: the catch-all below would otherwise turn a refusal into a 400
            // and tell the caller the ticket exists but something went wrong reading it.
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
        String paymentMethod = derivePaymentMethod(transaction);
        dto.setPaymentMethod(paymentMethod);
        dto.setCustody(PaymentMethod.custodyOf(paymentMethod).name());
        String saleChannel = ticket.getIssueMethod() != null ? ticket.getIssueMethod().name() : null;
        dto.setSaleChannel(saleChannel);
        dto.setSaleStage(SaleChannel.stageOf(saleChannel).name());

        return dto;
    }

    /**
     * Tickets grouped by sale stage (INC-010, ADR-012), excluding cancelled ones like every other
     * total. EnumMap keeps ON_BUS, PRE_BOOKED, UNKNOWN in declaration order so rows never reshuffle.
     */
    private List<SaleStageBreakdownEntryDTO> buildSaleBreakdown(List<Tickets> tickets) {
        Map<SaleChannel.SaleStage, SaleStageBreakdownEntryDTO> byStage = new EnumMap<>(SaleChannel.SaleStage.class);

        for (Tickets ticket : tickets) {
            if (ticket.getStatus() == Tickets.Status.CANCELLED) {
                continue;
            }
            SaleChannel.SaleStage stage = SaleChannel.stageOf(
                    ticket.getIssueMethod() != null ? ticket.getIssueMethod().name() : null);
            SaleStageBreakdownEntryDTO entry = byStage.computeIfAbsent(stage, s ->
                    new SaleStageBreakdownEntryDTO(s.name(), 0, 0, BigDecimal.ZERO));

            entry.setTicketCount(entry.getTicketCount() + 1);
            if (ticket.getStatus() == Tickets.Status.VALID) {
                entry.setBoardedCount(entry.getBoardedCount() + 1);
            }
            entry.setAmount(entry.getAmount().add(
                    ticket.getFareAmount() != null ? ticket.getFareAmount() : BigDecimal.ZERO));
        }

        return List.copyOf(byStage.values());
    }

    /**
     * Revenue grouped by payment method (INC-009). Methods are discovered from the tickets
     * themselves rather than enumerated here, so a payment method added later shows up with no
     * change to this method — and one whose code this build doesn't recognise still appears,
     * classified UNKNOWN, because money must never silently vanish from a revenue total.
     *
     * Ordered by PaymentMethod's declaration order (cash first, it's the one a conductor is
     * accountable for), with unrecognised codes last, so the UI's rows don't reshuffle between
     * refreshes.
     */
    private List<PaymentBreakdownEntryDTO> buildPaymentBreakdown(List<Tickets> tickets) {
        Map<String, PaymentBreakdownEntryDTO> byMethod = new LinkedHashMap<>();

        for (Tickets ticket : tickets) {
            if (ticket.getStatus() == Tickets.Status.CANCELLED) {
                continue; // cancelled fares are not revenue
            }
            String method = derivePaymentMethod(ticket.getTransactions());
            String key = method != null ? method : "UNKNOWN";
            BigDecimal fare = ticket.getFareAmount() != null ? ticket.getFareAmount() : BigDecimal.ZERO;

            PaymentBreakdownEntryDTO entry = byMethod.computeIfAbsent(key, code ->
                    new PaymentBreakdownEntryDTO(code, PaymentMethod.custodyOf(code).name(),
                            BigDecimal.ZERO, 0));
            entry.setAmount(entry.getAmount().add(fare));
            entry.setTicketCount(entry.getTicketCount() + 1);
        }

        return byMethod.values().stream()
                .sorted(Comparator.comparingInt(entry -> PaymentMethod.resolve(entry.getMethod())
                        .map(Enum::ordinal)
                        .orElse(Integer.MAX_VALUE)))
                .toList();
    }

    /**
     * The payment sub-record that actually exists is authoritative, not Transactions.paymentMethod
     * - that column is a CASH/ONLINE ordinal and cannot distinguish a conductor-collected CARD tap
     * (INC-008) from a passenger's own online booking, since both are stored as ONLINE.
     */
    private String derivePaymentMethod(Transactions transaction) {
        if (transaction == null) {
            return null;
        }
        if (transaction.getCash() != null) {
            return Online.Method.CASH.name();
        }
        if (transaction.getOnline() != null && transaction.getOnline().getMethod() != null) {
            return transaction.getOnline().getMethod().name();
        }
        return transaction.getPaymentMethod() != null ? transaction.getPaymentMethod().name() : null;
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
