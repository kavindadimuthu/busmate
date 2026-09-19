package com.busmate.ticketing_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tickets")
public class Tickets {
    public enum IssueMethod { CONDUCTOR, ONLINE }
    // VALID = validated at boarding by a conductor (cash tickets are VALID immediately on
    // issue; online tickets become VALID only when scanned/validated on the bus, same as
    // before - this flag is about *boarding*, not payment). NOT_VALID = not yet boarded,
    // regardless of payment state (payment state lives on Transactions/Online). CANCELLED =
    // passenger-cancelled before boarding.
    public enum Status { VALID, NOT_VALID, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "bus_id", nullable = false)
    private String busId;

    @Column(name = "trip_id", nullable = false)
    private String tripId;

    @Column(name = "conductor_id")
    private String conductorId;

    // Who sold this ticket, recorded at the moment of sale (INC-021). Never re-derived: a bus
    // sold to another operator afterwards must not rewrite who a past ticket belonged to.
    @Column(name = "operator_id")
    private String operatorId;

    @Column(name = "passenger_id")
    private String passengerId;

    @Column(name = "seat_number", length = 10)
    private String seatNumber;

    private String EndLocationId;
    private String StartLocationId;

    @Column(name = "fare_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal fareAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_method", nullable = false)
    private IssueMethod issueMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "issued_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime issuedAt;

    // Set only for an unpaid ONLINE booking; null once paid, cancelled, or for a conductor-issued
    // ticket. Governs whether reserveSeatsOrThrow() treats this ticket as an active hold or a
    // stale one it can expire and rebook over (INC-012).
    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @ManyToOne( cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Transactions transactions;
}
