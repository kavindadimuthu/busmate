package com.busmate.routeschedule.community.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Type;

import com.fasterxml.jackson.databind.JsonNode;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * A contributor's proposed change to one network record, held apart from the canonical tables
 * until a reviewer approves it (ADR-018). Generic by {@link ChangesetEntityType} so routes and
 * schedules can reuse it; only {@code STOP} is wired up today (INC-030).
 */
@Getter
@Setter
@ToString
@Entity
@Table(name = "changeset")
public class Changeset {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private ChangesetEntityType entityType;

    /** Null for CREATE — there is no target yet. */
    @Column(name = "target_id")
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangesetAction action;

    @ToString.Exclude
    @Type(JsonType.class)
    @Column(name = "proposed_values", columnDefinition = "jsonb", nullable = false)
    private JsonNode proposedValues;

    /** The target's version and values when this was proposed; both null for CREATE. */
    @Column(name = "target_version")
    private Long targetVersion;

    @ToString.Exclude
    @Type(JsonType.class)
    @Column(name = "target_snapshot", columnDefinition = "jsonb")
    private JsonNode targetSnapshot;

    @Column(name = "observed_on", nullable = false)
    private LocalDate observedOn;

    @Enumerated(EnumType.STRING)
    @Column(name = "observation_method", nullable = false)
    private ObservationMethod observationMethod;

    @ToString.Exclude
    @Column
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangesetStatus status = ChangesetStatus.PENDING;

    @Column(name = "proposer_user_id", nullable = false)
    private UUID proposerUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "decided_by")
    private UUID decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @ToString.Exclude
    @Column(name = "decision_reason")
    private String decisionReason;

    @Version
    private Long version;
}
