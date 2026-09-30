package com.busmate.ticketing_service.repository;

import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepo extends JpaRepository<Tickets, Long>, JpaSpecificationExecutor<Tickets> {
    List<Tickets> findByConductorId(String conductorId);

    List<Tickets> findByBusId(String busId);

    List<Tickets> findByTripId(String tripId);

    List<Tickets> findByPassengerId(String passengerId);

    /** Every live (non-cancelled) ticket already claiming any of these seats on this trip (INC-012). */
    List<Tickets> findByTripIdAndSeatNumberInAndStatusNot(
            String tripId, List<String> seatNumbers, Tickets.Status excludedStatus);

    /** Seat labels of every live (non-cancelled) ticket on this trip that has a seat (INC-068). Labels only. */
    @Query("select distinct t.seatNumber from Tickets t "
            + "where t.tripId = :tripId and t.status <> :excludedStatus and t.seatNumber is not null")
    List<String> findClaimedSeatNumbers(@Param("tripId") String tripId,
                                        @Param("excludedStatus") Tickets.Status excludedStatus);

    /** Unpaid online holds past their expiry, for the sweep to free (INC-012). */
    List<Tickets> findByIssueMethodAndStatusAndHoldExpiresAtBeforeAndTransactions_Status(
            Tickets.IssueMethod issueMethod, Tickets.Status status, LocalDateTime cutoff,
            Transactions.Status transactionStatus);
}
