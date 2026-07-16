package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.AuthCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuthCredentialRepository extends JpaRepository<AuthCredential, UUID> {

    /**
     * Bulk delete rather than {@code deleteById} — a social-only account (Phase 4) has no
     * credential row at all, and {@code deleteById} throws if the row doesn't exist. A no-op
     * bulk delete is exactly what account deletion needs either way.
     */
    @Modifying(clearAutomatically = true)
    @Query("delete from AuthCredential a where a.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
