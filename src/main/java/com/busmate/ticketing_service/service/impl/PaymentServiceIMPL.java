package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.entity.Cash;
import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
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
    public String issueTicket(PaymentRequestDTO requestDTO) {
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
                onlineRepo.save(onlinePayment);

                // Set ticket details
                ticket.setStatus(Tickets.Status.NOT_VALID); // Will be valid once payment is confirmed
                ticket.setIssueMethod(Tickets.IssueMethod.ONLINE);
                ticket.setTransactions(savedTransaction);
            }

            // Save ticket
            ticketRepo.save(ticket);

            return "Ticket issued successfully";

        } catch (Exception e) {
            return "Failed to issue ticket: " + e.getMessage();
        }
    }

    @Override
    public List<ConductorLogTicketDTO> getConductorLogDetails(String conductorId) {
        try {
            // Fetch all tickets for the given conductor
            List<Tickets> tickets = ticketRepo.findByConductorId(conductorId);

            // Convert tickets to DTOs
            return tickets.stream().map(ticket -> {
                ConductorLogTicketDTO dto = new ConductorLogTicketDTO();
                dto.setTicketId(ticket.getTicketId());
                dto.setPassengerId(ticket.getPassengerId());

                // Direct assignment of String location IDs
                dto.setStartLocationId(ticket.getStartLocationId());
                dto.setEndLocationId(ticket.getEndLocationId());

                dto.setSeatNumber(ticket.getSeatNumber());
                dto.setFareAmount(ticket.getFareAmount().doubleValue());
                dto.setIssuedAt(ticket.getIssuedAt());

                // Get payment status from transaction
                if (ticket.getTransactions() != null) {
                    dto.setPaymentStatus(ticket.getTransactions().getStatus().toString());
                } else {
                    dto.setPaymentStatus("UNKNOWN");
                }

                // Set passenger count to 1 (assuming 1 passenger per ticket)
                dto.setPassengerCount(1);

                return dto;
            }).toList();

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
            return tickets.stream().map(ticket -> {
                ConductorLogTicketDTO dto = new ConductorLogTicketDTO();
                dto.setTicketId(ticket.getTicketId());
                dto.setPassengerId(ticket.getPassengerId());

                // Direct assignment of String location IDs
                dto.setStartLocationId(ticket.getStartLocationId());
                dto.setEndLocationId(ticket.getEndLocationId());

                dto.setSeatNumber(ticket.getSeatNumber());
                dto.setFareAmount(ticket.getFareAmount().doubleValue());
                dto.setIssuedAt(ticket.getIssuedAt());

                // Get payment status from transaction
                if (ticket.getTransactions() != null) {
                    dto.setPaymentStatus(ticket.getTransactions().getStatus().toString());
                } else {
                    dto.setPaymentStatus("UNKNOWN");
                }

                // Set passenger count to 1 (assuming 1 passenger per ticket)
                dto.setPassengerCount(1);

                return dto;
            }).toList();

        } catch (Exception e) {
            // Return empty list in case of error
            return List.of();
        }
    }
}
