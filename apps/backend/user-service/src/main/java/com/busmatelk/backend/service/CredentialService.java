package com.busmatelk.backend.service;

import com.busmatelk.backend.model.AuthCredential;
import com.busmatelk.backend.repository.AuthCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Owns the {@code auth_credentials} table — the one place email/password secrets are created,
 * verified, and rotated. Nothing outside this service touches a password hash.
 */
@Service
@RequiredArgsConstructor
public class CredentialService {

    private final AuthCredentialRepository credentialRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void createCredential(UUID userId, String rawPassword) {
        AuthCredential credential = AuthCredential.builder()
                .userId(userId)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .passwordUpdatedAt(Instant.now())
                .build();
        credentialRepository.saveAndFlush(credential);
    }

    /**
     * True only when a local credential exists for the user and the password matches. A
     * social-only user (no credential row) always returns false, which the caller surfaces
     * as invalid credentials.
     */
    @Transactional(readOnly = true)
    public boolean verifyPassword(UUID userId, String rawPassword) {
        return credentialRepository.findById(userId)
                .map(credential -> passwordEncoder.matches(rawPassword, credential.getPasswordHash()))
                .orElse(false);
    }

    /**
     * Sets a new password, creating the credential row if the user didn't have one yet (e.g. a
     * social-only account adding a password). Callers are responsible for re-authenticating the
     * user first where that's required.
     *
     * <p>Flushes immediately (rather than leaving Hibernate to flush at commit) because every
     * caller follows this with a {@code RefreshTokenService} revocation, whose bulk
     * {@code @Modifying(clearAutomatically = true)} query clears the persistence context — which,
     * without an explicit flush first, silently discards this still-pending change before it ever
     * reaches the database.
     */
    @Transactional
    public void updatePassword(UUID userId, String newRawPassword) {
        AuthCredential credential = credentialRepository.findById(userId)
                .orElseGet(() -> AuthCredential.builder().userId(userId).build());
        credential.setPasswordHash(passwordEncoder.encode(newRawPassword));
        credential.setPasswordUpdatedAt(Instant.now());
        credentialRepository.saveAndFlush(credential);
    }
}
