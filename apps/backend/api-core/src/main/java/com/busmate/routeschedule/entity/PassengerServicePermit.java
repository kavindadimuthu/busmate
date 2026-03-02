package com.busmate.routeschedule.entity;

import com.busmate.routeschedule.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "passenger_service_permit")
public class PassengerServicePermit extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @ManyToOne
    @JoinColumn(name = "route_group_id", nullable = false)
    private RouteGroup routeGroup;

    @Column(name = "permit_number", nullable = false, unique = true)
    private String permitNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "maximum_bus_assigned", nullable = false)
    private Integer maximumBusAssigned;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusEnum status;

    @Enumerated(EnumType.STRING)
    @Column(name = "permit_type", nullable = false)
    private PassengerServicePermitTypeEnum permitType;
}
