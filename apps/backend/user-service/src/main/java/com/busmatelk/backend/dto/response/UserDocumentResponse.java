package com.busmatelk.backend.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Data;

@Data
public class UserDocumentResponse {
    private UUID id;
    private UUID userId;
    /** NIC_FRONT, NIC_BACK, DRIVING_LICENCE, CONDUCTOR_LICENCE, POLICE_CLEARANCE, MEDICAL_CERTIFICATE, OTHER */
    private String documentType;
    private String title;
    private String contentType;
    private Long sizeBytes;
    private LocalDate expiryDate;
    private boolean expired;
    private Instant createdAt;
}
