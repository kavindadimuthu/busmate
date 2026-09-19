package com.busmate.routeschedule.community.entity;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Where one person stands in the contributor programme (ADR-019). The account is a passenger in
 * user-service; this row is only what they may do to the network.
 */
@Getter
@Setter
@ToString
@Entity
@Table(name = "contributor")
public class Contributor {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContributorStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContributorLevel level = ContributorLevel.CONTRIBUTOR;

    // Personal data (invariant 8): kept out of toString so no log line can carry it.
    @ToString.Exclude
    @Column(nullable = false)
    private String motivation;

    @ToString.Exclude
    @Column(name = "home_district")
    private String homeDistrict;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Affiliation affiliation;

    @ToString.Exclude
    @Column(name = "affiliation_detail")
    private String affiliationDetail;

    @ToString.Exclude
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "contributor_corridor", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "route_group_id")
    private Set<UUID> corridorRouteGroupIds = new HashSet<>();

    @Column(name = "agreement_version", nullable = false)
    private String agreementVersion;

    @Column(name = "agreement_accepted_at", nullable = false)
    private Instant agreementAcceptedAt;

    @Column(name = "applied_at", nullable = false)
    private Instant appliedAt;

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
