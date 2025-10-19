package com.busmate.routeschedule.entity;

import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "operator")
public class Operator extends BaseEntity {
    @Id
    @GeneratedValue
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
}
