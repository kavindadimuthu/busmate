package com.busmatelk.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import com.busmatelk.backend.AbstractPostgresIntegrationTest;
import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.response.UserResponse;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.operator.CoreOperatorLookup;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

/**
 * INC-019: an operator manages only their own conductors, cannot move a conductor to another
 * operator, and keeps their conductors' documents. Real Postgres and MinIO; core-service's
 * operator lookup is the only stand-in.
 */
@SpringBootTest
class OperatorCrewScopeIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final String BUCKET = "test-crew-docs";

    @SuppressWarnings("resource")
    static final GenericContainer<?> MINIO =
            new GenericContainer<>("bitnamilegacy/minio:2025.7.23-debian-12-r3")
                    .withEnv("MINIO_ROOT_USER", "testaccesskey")
                    .withEnv("MINIO_ROOT_PASSWORD", "testsecretkey")
                    .withExposedPorts(9000)
                    .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000));

    static {
        MINIO.start();
    }

    @DynamicPropertySource
    static void mediaProperties(DynamicPropertyRegistry registry) {
        registry.add("media.s3.endpoint", () -> "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000));
        registry.add("media.s3.access-key", () -> "testaccesskey");
        registry.add("media.s3.secret-key", () -> "testsecretkey");
        registry.add("media.s3.bucket", () -> BUCKET);
    }

    @MockitoBean private CoreOperatorLookup coreOperatorLookup;

    @Autowired private UserService userService;
    @Autowired private AuthService authService;
    @Autowired private UserProfileService userProfileService;
    @Autowired private UserDocumentService documentService;
    @Autowired private UserRepository userRepository;
    @Autowired private UserProfileRepository userProfileRepository;
    @Autowired private UserTypeRepository userTypeRepository;
    @Autowired private S3Client s3;

    private final UUID operatorIdA = UUID.randomUUID();
    private final UUID operatorIdB = UUID.randomUUID();
    private UUID operatorUserA;
    private UUID operatorUserB;
    private UUID conductorA;
    private UUID conductorB;
    private UUID mot;

    @BeforeEach
    void setUp() {
        try {
            s3.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        } catch (BucketAlreadyOwnedByYouException ignored) {
            // shared container
        }
        operatorUserA = account("operator", Map.of());
        operatorUserB = account("operator", Map.of());
        mot = account("mot", Map.of("employee_id", "M-1"));
        conductorA = account("conductor", conductorProfile(operatorIdA));
        conductorB = account("conductor", conductorProfile(operatorIdB));
        when(coreOperatorLookup.operatorIdForUser(any())).thenReturn(Optional.empty());
        when(coreOperatorLookup.operatorIdForUser(operatorUserA)).thenReturn(Optional.of(operatorIdA));
        when(coreOperatorLookup.operatorIdForUser(operatorUserB)).thenReturn(Optional.of(operatorIdB));
    }

    @Test
    void inc019_operatorListsOnlyTheirOwnConductors() {
        List<UUID> ids = userService.listUsers(operatorUserA, "conductor", null, null, PageRequest.of(0, 200))
                .map(UserResponse::getUserId).getContent();
        assertThat(ids).contains(conductorA).doesNotContain(conductorB);
        assertThatThrownBy(() -> userService.listUsers(operatorUserA, "operator", null, null, PageRequest.of(0, 10)))
                .isInstanceOf(AccessDeniedException.class);
        // MOT keeps its platform-wide view
        List<UUID> motIds = userService.listUsers(mot, "conductor", null, null, PageRequest.of(0, 200))
                .map(UserResponse::getUserId).getContent();
        assertThat(motIds).contains(conductorA, conductorB);
    }

    @Test
    void inc019_operatorCannotReadOrChangeAnotherOperatorsConductor() {
        assertThat(userService.getUser(operatorUserA, conductorA).getUserId()).isEqualTo(conductorA);
        assertThatThrownBy(() -> userService.getUser(operatorUserA, conductorB)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userService.suspendUser(operatorUserA, conductorB)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userService.deleteUser(operatorUserA, conductorB)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userProfileService.updateProfile(operatorUserA, conductorB, Map.of("employee_id", "X")))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userService.getUser(operatorUserA, operatorUserB)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void inc019_aCreatedConductorIsAlwaysTheCreatingOperators() {
        CreateUserRequest request = new CreateUserRequest();
        request.setEmail("new-" + UUID.randomUUID() + "@crew.test");
        request.setPassword("Conductor9@2026");
        request.setFullName("New Conductor");
        request.setUsername("new" + UUID.randomUUID().toString().substring(0, 6));
        request.setUserType("conductor");
        request.setProfileData(new HashMap<>(conductorProfile(operatorIdB))); // tries to create for B
        UUID created = authService.createUser(request, operatorUserA).getUserId();
        assertThat(userProfileRepository.findByUserUserId(created).orElseThrow().getProfileData().get("assign_operator_id"))
                .isEqualTo(operatorIdA.toString());

        request.setUserType("operator");
        request.setEmail("op-" + UUID.randomUUID() + "@crew.test");
        assertThatThrownBy(() -> authService.createUser(request, operatorUserA)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void inc019_nobodyButAnAdminMovesAConductorBetweenOperators() {
        Map<String, Object> move = Map.of("assign_operator_id", operatorIdB.toString());
        assertThatThrownBy(() -> userProfileService.updateProfile(operatorUserA, conductorA, move))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userProfileService.updateProfile(conductorA, conductorA, move))
                .isInstanceOf(AccessDeniedException.class);
        // an unchanged value echoed back is fine
        userProfileService.updateProfile(operatorUserA, conductorA, Map.of("assign_operator_id", operatorIdA.toString(), "employee_id", "E-2"));
    }

    @Test
    void inc019_operatorKeepsTheirConductorsDocuments() {
        byte[] pdf = "%PDF-1.4\n%%EOF".getBytes(StandardCharsets.US_ASCII);
        var doc = documentService.upload(operatorUserA, conductorA, "NIC_FRONT", "NIC", null, pdf);
        assertThat(doc.getContentType()).isEqualTo("application/pdf");
        assertThat(documentService.list(operatorUserA, conductorA)).hasSize(1);
        assertThat(documentService.list(conductorA, conductorA)).hasSize(1);
        assertThat(documentService.list(mot, conductorA)).hasSize(1);
        assertThat(documentService.content(operatorUserA, conductorA, doc.getId()).bytes()).isEqualTo(pdf);

        assertThatThrownBy(() -> documentService.list(operatorUserB, conductorA)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> documentService.upload(conductorA, conductorA, "OTHER", null, null, pdf))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> documentService.upload(operatorUserA, conductorA, "PASSPORT", null, null, pdf))
                .isInstanceOf(IllegalArgumentException.class);

        documentService.delete(operatorUserA, conductorA, doc.getId());
        assertThat(documentService.list(operatorUserA, conductorA)).isEmpty();
    }

    private static Map<String, Object> conductorProfile(UUID operatorId) {
        return Map.of("employee_id", "E-1", "nic_number", "200012345678", "assign_operator_id", operatorId.toString());
    }

    private UUID account(String type, Map<String, Object> profile) {
        UUID userId = UUID.randomUUID();
        User user = userRepository.save(User.builder()
                .userId(userId)
                .email(userId + "@crew.test")
                .fullName(type + " " + userId.toString().substring(0, 4))
                .userType(userTypeRepository.findByName(type).orElseThrow())
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        userProfileRepository.save(UserProfile.builder().user(user).profileData(new HashMap<>(profile)).build());
        return userId;
    }
}
