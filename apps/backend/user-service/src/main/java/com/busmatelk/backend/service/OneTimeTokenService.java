package com.busmatelk.backend.service;

import com.busmatelk.backend.model.OneTimeToken;
import com.busmatelk.backend.model.OneTimeTokenType;
import com.busmatelk.backend.repository.OneTimeTokenRepository;
import com.busmatelk.backend.security.OpaqueTokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Owns the {@code one_time_tokens} table backing the email-verify and password-reset flows.
 */
@Service
@RequiredArgsConstructor
public class OneTimeTokenService {

    private static final long PASSWORD_RESET_TTL_SECONDS = 30 * 60;
    private static final long EMAIL_VERIFY_TTL_SECONDS = 24 * 60 * 60;

    private final OneTimeTokenRepository oneTimeTokenRepository;

    @Transactional
    public String issuePasswordResetToken(UUID userId) {
        return issue(userId, OneTimeTokenType.PASSWORD_RESET, PASSWORD_RESET_TTL_SECONDS);
    }

    @Transactional
    public String issueEmailVerificationToken(UUID userId) {
        return issue(userId, OneTimeTokenType.EMAIL_VERIFY, EMAIL_VERIFY_TTL_SECONDS);
    }

    /**
     * Validates and consumes a token, returning the user id it was issued for. Throws
     * {@link InvalidTokenException} (→ 401) for anything unknown, expired, or already used —
     * these tokens are single-use, so a second attempt with the same link always fails, whether
     * or not the first attempt succeeded.
     */
    @Transactional
    public UUID consume(String rawToken, OneTimeTokenType type) {
        OneTimeToken token = oneTimeTokenRepository.findByTokenHashAndType(OpaqueTokenGenerator.hash(rawToken), type)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired token"));

        if (token.getConsumedAt() != null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Invalid or expired token");
        }

        token.setConsumedAt(Instant.now());
        oneTimeTokenRepository.save(token);
        return token.getUserId();
    }

    private String issue(UUID userId, OneTimeTokenType type, long ttlSeconds) {
        // A user requesting a new link shouldn't leave an older, still-emailed one usable.
        oneTimeTokenRepository.invalidateActive(userId, type, Instant.now());

        String rawToken = OpaqueTokenGenerator.generate();
        oneTimeTokenRepository.save(OneTimeToken.builder()
                .userId(userId)
                .type(type)
                .tokenHash(OpaqueTokenGenerator.hash(rawToken))
                .expiresAt(Instant.now().plusSeconds(ttlSeconds))
                .build());
        return rawToken;
    }
}
