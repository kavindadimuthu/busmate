package com.busmatelk.backend.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.busmatelk.backend.dto.request.UpdateUserDocumentRequest;
import com.busmatelk.backend.dto.response.UserDocumentResponse;
import com.busmatelk.backend.service.UserDocumentService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

/** A conductor's scanned documents (INC-019). Access rules live in {@link UserDocumentService}. */
@RestController
@RequestMapping("/api/users/{userId}/documents")
@RequiredArgsConstructor
public class UserDocumentsController {

    private final UserDocumentService documentService;

    @GetMapping
    @Operation(operationId = "listUserDocuments")
    public ResponseEntity<List<UserDocumentResponse>> list(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(documentService.list(callerId(authentication), userId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(operationId = "uploadUserDocument")
    public ResponseEntity<UserDocumentResponse> upload(
            Authentication authentication,
            @PathVariable UUID userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "expiryDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate)
            throws IOException {
        return new ResponseEntity<>(documentService.upload(callerId(authentication), userId, documentType, title,
                expiryDate, file.getBytes()), HttpStatus.CREATED);
    }

    @PatchMapping("/{documentId}")
    @Operation(operationId = "updateUserDocument")
    public ResponseEntity<UserDocumentResponse> update(Authentication authentication, @PathVariable UUID userId,
                                                       @PathVariable UUID documentId, @RequestBody UpdateUserDocumentRequest request) {
        return ResponseEntity.ok(documentService.update(callerId(authentication), userId, documentId, request));
    }

    @DeleteMapping("/{documentId}")
    @Operation(operationId = "deleteUserDocument")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID userId, @PathVariable UUID documentId) {
        documentService.delete(callerId(authentication), userId, documentId);
        return ResponseEntity.noContent().build();
    }

    /** Always an attachment and sandboxed: a stored PDF is served exactly as uploaded. */
    @GetMapping(value = "/{documentId}/content",
            produces = { MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.APPLICATION_PDF_VALUE })
    @Operation(operationId = "getUserDocumentContent")
    public ResponseEntity<byte[]> content(Authentication authentication, @PathVariable UUID userId, @PathVariable UUID documentId) {
        UserDocumentService.Content content = documentService.content(callerId(authentication), userId, documentId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.document().getContentType()));
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Content-Security-Policy", "sandbox");
        headers.setCacheControl(CacheControl.noStore());
        String extension = "application/pdf".equals(content.document().getContentType()) ? ".pdf"
                : "image/png".equals(content.document().getContentType()) ? ".png" : ".jpg";
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(content.document().getDocumentType().toLowerCase() + extension).build());
        return new ResponseEntity<>(content.bytes(), headers, HttpStatus.OK);
    }

    private UUID callerId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}
