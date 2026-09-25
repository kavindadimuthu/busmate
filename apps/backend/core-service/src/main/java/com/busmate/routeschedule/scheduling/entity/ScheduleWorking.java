package com.busmate.routeschedule.scheduling.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.shared.provenance.ProvenancedEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Who normally works a departure between two dates (ADR-024). A claim about a pattern, never about a
 * particular day: nothing here is written onto a trip, and it reaches a passenger as "usually …".
 *
 * The operator is a claim that may be unresolved — {@code operatorNameObserved} is what someone saw, and
 * {@code operator} is set only when staff link it to a real operator.
 */
@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)
@Entity
@Table(name = "schedule_working")
public class ScheduleWorking extends ProvenancedEntity {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    @ToString.Include
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "effective_start_date", nullable = false)
    private LocalDate effectiveStartDate;

    /** Null means still current. */
    @Column(name = "effective_end_date")
    private LocalDate effectiveEndDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator;

    @Column(name = "operator_name_observed")
    private String operatorNameObserved;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_class")
    private ServiceClassEnum serviceClass;

    /** Several rows mean "one of these", with no order asserted. */
    @OneToMany(mappedBy = "working", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ScheduleWorkingVehicle> vehicles = new ArrayList<>();

    /** The operator this claim is about: the linked one, else the name as seen (case-insensitive), else none. */
    public String operatorKey() {
        if (operator != null) {
            return "id:" + operator.getId();
        }
        if (operatorNameObserved != null && !operatorNameObserved.isBlank()) {
            return "name:" + operatorNameObserved.strip().toLowerCase();
        }
        return "";
    }

    /** True if both ranges include at least one day in common; a null end means still current. */
    public boolean overlaps(LocalDate otherStart, LocalDate otherEnd) {
        boolean startsBeforeOtherEnds = otherEnd == null || !effectiveStartDate.isAfter(otherEnd);
        boolean otherStartsBeforeThisEnds = effectiveEndDate == null || !otherStart.isAfter(effectiveEndDate);
        return startsBeforeOtherEnds && otherStartsBeforeThisEnds;
    }
}
