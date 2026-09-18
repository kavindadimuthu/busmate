package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import com.busmate.ticketing_service.repository.OnlineRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.busmate.ticketing_service.repository.TransactionsRepo;
import com.busmate.ticketing_service.service.SeatHoldService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SeatHoldServiceImpl implements SeatHoldService {

    private final TicketRepo ticketRepo;
    private final TransactionsRepo transactionsRepo;
    private final OnlineRepo onlineRepo;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireIfStale(Long ticketId) {
        Tickets ticket = ticketRepo.findById(ticketId).orElse(null);
        if (ticket == null || !isStale(ticket)) {
            return false;
        }
        expire(ticket);
        return true;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireAllStaleHolds() {
        ticketRepo.findByIssueMethodAndStatusAndHoldExpiresAtBeforeAndTransactions_Status(
                        Tickets.IssueMethod.ONLINE, Tickets.Status.NOT_VALID,
                        LocalDateTime.now(), Transactions.Status.PENDING)
                .forEach(this::expire);
    }

    /** An unpaid online booking whose hold window has passed - safe to cancel and rebook over. */
    private boolean isStale(Tickets ticket) {
        if (ticket.getIssueMethod() != Tickets.IssueMethod.ONLINE) {
            return false;
        }
        Transactions transaction = ticket.getTransactions();
        if (transaction == null || transaction.getStatus() != Transactions.Status.PENDING) {
            return false;
        }
        return ticket.getHoldExpiresAt() != null && ticket.getHoldExpiresAt().isBefore(LocalDateTime.now());
    }

    /**
     * Frees a seat by cancelling the ticket that was holding it - the same terminal state a
     * genuine passenger cancellation reaches, so nothing downstream (the seat-uniqueness index, a
     * conductor's seat map) needs to know *why* the seat became free.
     */
    private void expire(Tickets ticket) {
        ticket.setStatus(Tickets.Status.CANCELLED);
        ticketRepo.save(ticket);

        Transactions transaction = ticket.getTransactions();
        if (transaction != null) {
            transaction.setStatus(Transactions.Status.FAILED);
            transactionsRepo.save(transaction);
            if (transaction.getOnline() != null) {
                Online online = transaction.getOnline();
                online.setStatus(Online.Status.FAILED);
                onlineRepo.save(online);
            }
        }
    }
}
