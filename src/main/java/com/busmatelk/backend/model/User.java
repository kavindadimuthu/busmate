package com.busmatelk.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "full_name" , nullable = false)
    private String fullName;

    @Column(name = "username", unique = true)
    private String username;

    @Column(name = "phone_number" )
    private String phoneNumber;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "role")
    private String role;

    @Column(name = "account_status")
    private String accountStatus;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Conductor conductor;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Passenger passenger;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Timekeeper timekeeper;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Mot mot;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private fleetOperatorModel operator;

}
