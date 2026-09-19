package com.busmatelk.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.busmatelk.backend.model.UserDocument;

public interface UserDocumentRepository extends JpaRepository<UserDocument, UUID> {
    List<UserDocument> findByUserIdOrderByCreatedAtAsc(UUID userId);

    long countByUserId(UUID userId);
}
