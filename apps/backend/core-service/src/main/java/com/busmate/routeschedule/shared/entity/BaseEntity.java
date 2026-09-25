package com.busmate.routeschedule.shared.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Version;
import lombok.Data;

@Data
@MappedSuperclass
public abstract class BaseEntity {
    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    /**
     * Stamped here rather than with Hibernate's {@code @CreationTimestamp}/{@code @UpdateTimestamp}
     * (INC-040). Those are applied immediately before the INSERT executes — i.e. at flush — but
     * every create path in this service is transactional and maps the entity to its response DTO
     * right after {@code save()}, while the flush is still pending. The row ended up with correct
     * timestamps; the response returned nulls for them. A {@code @PrePersist} callback runs
     * synchronously inside {@code persist()}, so the entity carries the values before anything
     * reads it — the same reason {@link com.busmate.routeschedule.shared.provenance.ProvenancedEntity}
     * can stamp provenance this way and have it survive into the response.
     */
    @PrePersist
    void stampCreated() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void stampUpdated() {
        updatedAt = LocalDateTime.now();
    }
}
