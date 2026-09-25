package com.busmate.routeschedule.scheduling.entity;

import java.util.UUID;

import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.shared.provenance.ProvenancedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * A vehicle a working names (ADR-024): a plate as seen, and/or the {@code Bus} staff linked it to. It has
 * its own provenance — a certain plate under an uncertain operator name needs two tiers.
 */
@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)
@Entity
@Table(name = "schedule_working_vehicle")
public class ScheduleWorkingVehicle extends ProvenancedEntity {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    @ToString.Include
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "working_id", nullable = false)
    private ScheduleWorking working;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    private Bus bus;

    @Column(name = "plate_observed")
    private String plateObserved;
}
