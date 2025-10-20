package com.busmatelk.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "conductor_profile")
public class Conductor {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    @Column( nullable = false, unique = true)
    private String employee_id;

    @Column(nullable = false)
    private String assign_operator_id;
    private String shift_status;
    @Column(nullable = false)
    private String NicNumber;
    private String Dateofbirth;
    private String pr_img_path;

    @OneToOne
    @JoinColumn(name = "user_id")  // This is both PK and FK
    private User user;

}
