package com.busmate.ticketing_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "cash_payments")
public class Cash {

    public enum Action { ISSUED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "conductor_id", nullable = false)
    private String conductorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private Action action;


    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id", referencedColumnName = "transaction_id")
    private Transactions transactions;

}
