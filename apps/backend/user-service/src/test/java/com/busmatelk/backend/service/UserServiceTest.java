package com.busmatelk.backend.service;

import com.busmatelk.backend.AbstractPostgresIntegrationTest;
import com.busmatelk.backend.dto.response.UserResponse;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.AuthAuditLogRepository;
import com.busmatelk.backend.repository.AuthCredentialRepository;
import com.busmatelk.backend.repository.UserIdentityRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Phase 5: account status transitions (suspend/deactivate/delete/reactivate) now operate purely
 * locally — no Supabase admin calls — and each one revokes live sessions and writes an
 * auth_audit_log entry. Exercised through UserService directly (not MockMvc/JWTs): the point here
 * is the transition/permission/session-revocation logic, which PermissionMatrixTest already
 * covers at the HTTP-agnostic layer this mirrors.
 */
@SpringBootTest
class UserServiceTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserTypeRepository userTypeRepository;
    @Autowired
    private CredentialService credentialService;
    @Autowired
    private RefreshTokenService refreshTokenService;
    @Autowired
    private AuthCredentialRepository credentialRepository;
    @Autowired
    private UserIdentityRepository userIdentityRepository;
    @Autowired
    private AuthAuditLogRepository auditLogRepository;

    @Test
    void suspendBlocksLoginAndRevokesSessionsAndAudits() {
        UUID adminId = seedUser("admin", "active");
        UUID targetId = seedUser("passenger", "active");
        String refreshToken = refreshTokenService.issue(targetId);

        UserResponse response = userService.suspendUser(adminId, targetId);

        assertThat(response.getAccountStatus()).isEqualTo("suspended");
        assertThat(userRepository.findById(targetId).orElseThrow().getAccountStatus()).isEqualTo("suspended");
        assertThatThrownBy(() -> refreshTokenService.rotate(refreshToken)).isInstanceOf(InvalidTokenException.class);
        assertThat(latestAuditAction(targetId)).isEqualTo("account.suspended");
    }

    @Test
    void deactivateRevokesSessionsAndAudits() {
        UUID adminId = seedUser("admin", "active");
        UUID targetId = seedUser("passenger", "active");
        String refreshToken = refreshTokenService.issue(targetId);

        UserResponse response = userService.deactivateUser(adminId, targetId);

        assertThat(response.getAccountStatus()).isEqualTo("deactivated");
        assertThatThrownBy(() -> refreshTokenService.rotate(refreshToken)).isInstanceOf(InvalidTokenException.class);
        assertThat(latestAuditAction(targetId)).isEqualTo("account.deactivated");
    }

    @Test
    void reactivateRestoresActiveStatusAfterSuspension() {
        UUID adminId = seedUser("admin", "active");
        UUID targetId = seedUser("passenger", "active");
        userService.suspendUser(adminId, targetId);

        UserResponse response = userService.reactivateUser(adminId, targetId);

        assertThat(response.getAccountStatus()).isEqualTo("active");
        assertThat(latestAuditAction(targetId)).isEqualTo("account.reactivated");
    }

    @Test
    void deleteSoftDeletesAndPurgesCredentialsAndIdentitiesAndRevokesSessions() {
        UUID adminId = seedUser("admin", "active");
        UUID targetId = seedUser("passenger", "active");
        credentialService.createCredential(targetId, "Sup3rSecret!");
        String refreshToken = refreshTokenService.issue(targetId);

        userService.deleteUser(adminId, targetId);

        assertThat(userRepository.findById(targetId).orElseThrow().getAccountStatus()).isEqualTo("deleted");
        assertThat(credentialRepository.findById(targetId)).isEmpty();
        assertThat(userIdentityRepository.findByUserId(targetId)).isEmpty();
        assertThatThrownBy(() -> refreshTokenService.rotate(refreshToken)).isInstanceOf(InvalidTokenException.class);
        assertThat(latestAuditAction(targetId)).isEqualTo("account.deleted");
    }

    @Test
    void deleteOfASociallyOnlyAccountWithNoCredentialRowDoesNotFail() {
        // A Phase 4 social-only passenger has no auth_credentials row at all — the purge must be
        // a no-op bulk delete rather than a deleteById that throws when nothing matches.
        UUID adminId = seedUser("admin", "active");
        UUID targetId = seedUser("passenger", "active");

        userService.deleteUser(adminId, targetId);

        assertThat(userRepository.findById(targetId).orElseThrow().getAccountStatus()).isEqualTo("deleted");
    }

    @Test
    void deletedAccountsCannotBeReactivated() {
        UUID adminId = seedUser("admin", "active");
        UUID targetId = seedUser("passenger", "active");
        userService.deleteUser(adminId, targetId);

        assertThatThrownBy(() -> userService.reactivateUser(adminId, targetId))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void suspendRequiresPermission() {
        UUID passengerId = seedUser("passenger", "active");
        UUID targetId = seedUser("passenger", "active");

        assertThatThrownBy(() -> userService.suspendUser(passengerId, targetId))
                .isInstanceOf(AccessDeniedException.class);
    }

    private String latestAuditAction(UUID userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 1))
                .getContent().get(0).getAction();
    }

    private UUID seedUser(String userTypeName, String accountStatus) {
        UUID userId = UUID.randomUUID();
        UserType userType = userTypeRepository.findByName(userTypeName).orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email(userTypeName + "-" + userId + "@example.com")
                .userType(userType)
                .accountStatus(accountStatus)
                .isEmailVerified(true)
                .build());
        return userId;
    }
}
