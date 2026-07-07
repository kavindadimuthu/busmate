package com.busmate.ticketing_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.apache.kafka.common.protocol.types.Field.Str;

@Entity
@Data
@Table(name = "online")
public class Online {

    public enum Method { PAYHERE, CASH, CARD }
    public enum Status { PENDING, SUCCESS, FAILED, REFUNDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "passenger_id")
    private String passengerId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false)
    private Method method;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id", referencedColumnName = "transaction_id")
    private Transactions transactions;

    // Getters and setters omitted for brevity
}
