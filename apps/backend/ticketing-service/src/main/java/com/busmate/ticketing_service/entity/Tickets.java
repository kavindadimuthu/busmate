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
    public enum Status { VALID, NOT_VALID }

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

    @ManyToOne( cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Transactions transactions;
}
