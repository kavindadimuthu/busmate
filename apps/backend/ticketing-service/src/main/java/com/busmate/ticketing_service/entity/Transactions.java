package com.busmate.ticketing_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
public class Transactions {

    public enum Status { PENDING, COMPLETED, FAILED, ISSUED,REFUNDED }
    public enum Method { CASH, ONLINE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private int transactionId;

    private Method paymentMethod;
    private Double TotalAmount;
    private Status status = Status.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "transactions", cascade = CascadeType.ALL)
    private Cash cash;

    @OneToOne(mappedBy = "transactions", cascade = CascadeType.ALL)
    private Online online;

}
