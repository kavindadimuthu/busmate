package com.busmatelk.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "fleetoperator_profile")
public class fleetOperatorModel {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "operator_type")
    private String operatorType;

    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "region")
    private String region;

    @Column(name = "registration_id")
    private String registrationId;

    private String pr_img_path;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> contact_details;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", unique = true, nullable = false)
    private User user; // This is both PK and FK, linking to User entity
}
