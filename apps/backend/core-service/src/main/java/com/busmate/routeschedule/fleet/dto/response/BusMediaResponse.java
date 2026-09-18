package com.busmate.routeschedule.fleet.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

/** A bus photo or document's metadata; the bytes are fetched from its content endpoint. */
@Data
public class BusMediaResponse {
    private UUID id;
    private UUID busId;
    /** PHOTO or DOCUMENT */
    private String kind;
    /** For documents: REGISTRATION_CERTIFICATE, REVENUE_LICENCE, INSURANCE, ... */
    private String documentType;
    private String title;
    private String contentType;
    private Long sizeBytes;
    private boolean cover;
    private LocalDate expiryDate;
    /** A document whose expiry date has passed. */
    private boolean expired;
    private LocalDateTime createdAt;
    private String createdBy;
}
