package com.busmate.routeschedule.fleet.entity;

import java.time.LocalDate;
import java.util.UUID;

import com.busmate.routeschedule.fleet.enums.BusDocumentTypeEnum;
import com.busmate.routeschedule.fleet.enums.BusMediaKindEnum;
import com.busmate.routeschedule.shared.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** A photo or scanned document of a bus (INC-018). The bytes live in object storage. */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "bus_media")
public class BusMedia extends BaseEntity {

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false)
    private BusMediaKindEnum kind;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type")
    private BusDocumentTypeEnum documentType;

    @Column(name = "title", length = 200)
    private String title;

    // Derived from the bus and media ids by the server; never taken from a client.
    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "cover", nullable = false)
    private boolean cover;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;
}
