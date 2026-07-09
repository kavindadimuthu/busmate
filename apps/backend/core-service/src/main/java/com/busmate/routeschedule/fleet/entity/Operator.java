package com.busmate.routeschedule.fleet.entity;

import com.busmate.routeschedule.fleet.enums.OperatorTypeEnum;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.UUID;
import com.busmate.routeschedule.shared.entity.BaseEntity;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "operator")
public class Operator extends BaseEntity {
    @Id
    // @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "operator_type", nullable = false)
    private OperatorTypeEnum operatorType;

    @Column(nullable = false)
    private String name;

    @Column
    private String region;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusEnum status;

    // Links this business entity back to its owning account in user-service.
    // Nullable because operators created before the unified lifecycle (or directly via
    // this service's own /api/operators) have no linked account.
    @Column(name = "user_id", unique = true)
    private UUID userId;
}
