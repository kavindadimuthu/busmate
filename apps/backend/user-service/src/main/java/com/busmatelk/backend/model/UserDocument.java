package com.busmatelk.backend.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/** A scanned document of a conductor (INC-019). The bytes live in object storage. */
@Data
@Entity
@Table(name = "user_documents")
public class UserDocument {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "document_type", nullable = false)
    private String documentType;

    @Column(name = "title")
    private String title;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
