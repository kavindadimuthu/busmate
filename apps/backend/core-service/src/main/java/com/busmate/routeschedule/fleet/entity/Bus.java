package com.busmate.routeschedule.fleet.entity;

import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Type;
import java.util.UUID;
import com.busmate.routeschedule.shared.entity.BaseEntity;
import com.busmate.routeschedule.fleet.entity.Operator;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "bus")
public class Bus extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @Column(name = "ntc_registration_number", nullable = false, unique = true)
    private String ntcRegistrationNumber;

    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;

    @Column(nullable = false)
    private Integer capacity;

    @Column
    private String model;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode facilities;

    // Structured seat layout of the bus (rows of left/right/back seat-id arrays + blocked seats).
    // A value object owned by the Bus aggregate, stored as jsonb like `facilities`. Nullable:
    // when absent, the service layer returns a default 2+2 layout derived from `capacity`.
    @Type(JsonType.class)
    @Column(name = "seat_layout", columnDefinition = "jsonb")
    private JsonNode seatLayout;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusEnum status;
}
