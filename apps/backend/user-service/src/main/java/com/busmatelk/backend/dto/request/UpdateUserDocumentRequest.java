package com.busmatelk.backend.dto.request;

import java.time.LocalDate;

import lombok.Data;

/** Fields left null are unchanged; clearExpiryDate removes the expiry. */
@Data
public class UpdateUserDocumentRequest {
    private String documentType;
    private String title;
    private LocalDate expiryDate;
    private Boolean clearExpiryDate;
}
