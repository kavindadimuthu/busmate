package com.busmatelk.backend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmatelk.backend.dto.request.UpdateUserDocumentRequest;
import com.busmatelk.backend.dto.response.UserDocumentResponse;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserDocument;
import com.busmatelk.backend.operator.OperatorScope;
import com.busmatelk.backend.repository.UserDocumentRepository;
import com.busmatelk.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * A conductor's scanned documents (INC-019): NIC, licences, police clearance, medical
 * certificate. Personal data — readable by the conductor, their own operator and MOT/admin
 * (the same reach as the profile, via {@link UserService#requireReadAccess}); kept by the
 * operator or an admin (manager access only: a conductor cannot replace their own record).
 */
@Service
@RequiredArgsConstructor
public class UserDocumentService {

    static final Set<String> TYPES = Set.of("NIC_FRONT", "NIC_BACK", "DRIVING_LICENCE", "CONDUCTOR_LICENCE",
            "POLICE_CLEARANCE", "MEDICAL_CERTIFICATE", "OTHER");
    static final int MAX_DOCUMENTS = 20;

    private final UserRepository userRepository;
    private final UserDocumentRepository documentRepository;
    private final UserService userService;
    private final MediaStorageService storage;
    private final DocumentSanitizer documentSanitizer;

    @Value("${media.max-upload-bytes}")
    private long maxUploadBytes;

    public List<UserDocumentResponse> list(UUID callerId, UUID userId) {
        User target = requireConductor(userId);
        userService.requireReadAccess(callerId, userId, target.getUserType().getName());
        return documentRepository.findByUserIdOrderByCreatedAtAsc(userId).stream().map(UserDocumentService::toResponse).toList();
    }

    @Transactional
    public UserDocumentResponse upload(UUID callerId, UUID userId, String documentType, String title,
                                       LocalDate expiryDate, byte[] bytes) {
        requireManager(callerId, userId);
        String type = requireType(documentType);
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("No file was uploaded.");
        }
        if (bytes.length > maxUploadBytes) {
            throw new IllegalArgumentException("The file is too large: " + bytes.length + " bytes, and the limit is "
                    + maxUploadBytes + " bytes.");
        }
        if (documentRepository.countByUserId(userId) >= MAX_DOCUMENTS) {
            throw new IllegalArgumentException("A conductor can have at most " + MAX_DOCUMENTS + " documents");
        }
        ImageSanitizer.SanitizedImage clean = documentSanitizer.sanitize(bytes);

        UserDocument document = new UserDocument();
        document.setId(UUID.randomUUID());
        document.setUserId(userId);
        document.setDocumentType(type);
        document.setTitle(title != null && !title.isBlank() ? title.trim() : null);
        document.setExpiryDate(expiryDate);
        document.setContentType(clean.contentType());
        document.setSizeBytes((long) clean.bytes().length);
        document.setStorageKey("users/" + userId + "/documents/" + document.getId());
        document.setCreatedBy(callerId);
        storage.put(document.getStorageKey(), clean.bytes(), clean.contentType());
        return toResponse(documentRepository.save(document));
    }

    @Transactional
    public UserDocumentResponse update(UUID callerId, UUID userId, UUID documentId, UpdateUserDocumentRequest request) {
        requireManager(callerId, userId);
        UserDocument document = requireDocument(userId, documentId);
        if (request.getDocumentType() != null) {
            document.setDocumentType(requireType(request.getDocumentType()));
        }
        if (request.getTitle() != null) {
            document.setTitle(request.getTitle().isBlank() ? null : request.getTitle().trim());
        }
        if (Boolean.TRUE.equals(request.getClearExpiryDate())) {
            document.setExpiryDate(null);
        } else if (request.getExpiryDate() != null) {
            document.setExpiryDate(request.getExpiryDate());
        }
        return toResponse(documentRepository.save(document));
    }

    @Transactional
    public void delete(UUID callerId, UUID userId, UUID documentId) {
        requireManager(callerId, userId);
        UserDocument document = requireDocument(userId, documentId);
        documentRepository.delete(document);
        documentRepository.flush();
        storage.delete(document.getStorageKey());
    }

    public record Content(UserDocument document, byte[] bytes) {}

    public Content content(UUID callerId, UUID userId, UUID documentId) {
        User target = requireConductor(userId);
        userService.requireReadAccess(callerId, userId, target.getUserType().getName());
        UserDocument document = requireDocument(userId, documentId);
        byte[] bytes = storage.get(document.getStorageKey())
                .orElseThrow(() -> new NoSuchElementException("The file for this document is missing from storage"))
                .bytes();
        return new Content(document, bytes);
    }

    private void requireManager(UUID callerId, UUID userId) {
        User target = requireConductor(userId);
        if (callerId.equals(userId)) {
            throw new AccessDeniedException("Your operator keeps your documents");
        }
        userService.requireUpdateAccess(callerId, userId, target.getUserType().getName());
    }

    private User requireConductor(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        if (!OperatorScope.CONDUCTOR.equals(user.getUserType().getName())) {
            throw new IllegalArgumentException("Documents are kept for conductor accounts only");
        }
        return user;
    }

    private UserDocument requireDocument(UUID userId, UUID documentId) {
        return documentRepository.findById(documentId)
                .filter(d -> d.getUserId().equals(userId))
                .orElseThrow(() -> new NoSuchElementException("Document not found: " + documentId));
    }

    private static String requireType(String value) {
        if (value == null || !TYPES.contains(value)) {
            throw new IllegalArgumentException("documentType must be one of " + TYPES);
        }
        return value;
    }

    static UserDocumentResponse toResponse(UserDocument d) {
        UserDocumentResponse r = new UserDocumentResponse();
        r.setId(d.getId());
        r.setUserId(d.getUserId());
        r.setDocumentType(d.getDocumentType());
        r.setTitle(d.getTitle());
        r.setContentType(d.getContentType());
        r.setSizeBytes(d.getSizeBytes());
        r.setExpiryDate(d.getExpiryDate());
        r.setExpired(d.getExpiryDate() != null && d.getExpiryDate().isBefore(LocalDate.now()));
        r.setCreatedAt(d.getCreatedAt());
        return r;
    }
}
