package com.busmatelk.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Data
@Table(name = "timekeepers")
public class Timekeeper {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "assign_stand")
    private String assignStand;

    @Column(name = "nic")
    private String nic;

    @Column(name = "province")
    private String province;



}
