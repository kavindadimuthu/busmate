package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;

import com.busmate.routeschedule.shared.entity.BaseEntity;

import jakarta.persistence.Embedded;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * A reference record that carries {@link Provenance}. {@link ProvenanceStamper} sets it deliberately
 * on the write paths that know who is acting; the {@code PrePersist} default is the net under any
 * path that does not, so no record is ever stored unlabelled.
 */
@Data
@EqualsAndHashCode(callSuper = false)
@MappedSuperclass
public abstract class ProvenancedEntity extends BaseEntity {

    @Embedded
    private Provenance provenance;

    @PrePersist
    void defaultProvenance() {
        if (provenance == null || provenance.getSourceTier() == null) {
            provenance = Provenance.of(SourceTier.SRC_4, null, null, Instant.now());
        }
    }
}
