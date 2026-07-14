package com.busmatelk.backend;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import com.busmatelk.backend.service.PermissionService;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies PermissionService.hasPermission() against the full permission matrix from
 * docs/user-management/user-management-redesign.md, seeded into H2 via data.sql exactly as
 * Phase 2 seeded the real Supabase project.
 *
 * Two cells intentionally differ from the design doc's matrix, reflecting what's actually
 * live rather than silently "fixing" a production access-control gap as a side effect of
 * writing tests:
 *   - user.mot:read        doc also grants `mot` itself; the live seed does not
 *   - user.timekeeper:read doc also grants `timekeeper` itself; the live seed does not
 * All other 26 of 28 permission rows match the design doc exactly.
 */
@SpringBootTest
class PermissionMatrixTest {

    private static final List<String> ROLES =
            List.of("admin", "mot", "timekeeper", "operator", "conductor", "passenger");

    private static final Map<String, Set<String>> MATRIX = new LinkedHashMap<>();

    static {
        MATRIX.put("profile:read:own", Set.of("admin", "mot", "timekeeper", "operator", "conductor", "passenger"));
        MATRIX.put("profile:update:own", Set.of("admin", "mot", "timekeeper", "operator", "conductor", "passenger"));
        MATRIX.put("user.admin:create", Set.of("admin"));
        MATRIX.put("user.admin:read", Set.of("admin"));
        MATRIX.put("user.admin:update", Set.of("admin"));
        MATRIX.put("user.admin:delete", Set.of("admin"));
        MATRIX.put("user.mot:create", Set.of("admin"));
        MATRIX.put("user.mot:read", Set.of("admin")); // doc also grants `mot` — see class javadoc
        MATRIX.put("user.mot:update", Set.of("admin"));
        MATRIX.put("user.mot:delete", Set.of("admin"));
        MATRIX.put("user.timekeeper:create", Set.of("admin", "mot"));
        MATRIX.put("user.timekeeper:read", Set.of("admin", "mot")); // doc also grants `timekeeper` — see class javadoc
        MATRIX.put("user.timekeeper:update", Set.of("admin", "mot"));
        MATRIX.put("user.timekeeper:delete", Set.of("admin", "mot"));
        MATRIX.put("user.operator:create", Set.of("admin", "mot"));
        MATRIX.put("user.operator:read", Set.of("admin", "mot", "timekeeper"));
        MATRIX.put("user.operator:update", Set.of("admin", "mot"));
        MATRIX.put("user.operator:delete", Set.of("admin", "mot"));
        MATRIX.put("user.conductor:create", Set.of("admin", "operator"));
        MATRIX.put("user.conductor:read", Set.of("admin", "mot", "timekeeper", "operator"));
        MATRIX.put("user.conductor:update", Set.of("admin", "operator"));
        MATRIX.put("user.conductor:delete", Set.of("admin", "operator"));
        MATRIX.put("user.passenger:create", Set.of("admin"));
        MATRIX.put("user.passenger:read", Set.of("admin", "mot", "operator", "conductor"));
        MATRIX.put("user.passenger:update", Set.of("admin"));
        MATRIX.put("user.passenger:delete", Set.of("admin"));
        MATRIX.put("user-type:manage", Set.of("admin"));
        MATRIX.put("permission:manage", Set.of("admin"));
    }

    @Autowired
    private PermissionService permissionService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserTypeRepository userTypeRepository;

    @TestFactory
    Stream<DynamicTest> permissionMatrix() {
        Map<String, UUID> userIdByRole = new LinkedHashMap<>();
        for (String role : ROLES) {
            UserType userType = userTypeRepository.findByName(role).orElseThrow();
            UUID userId = UUID.randomUUID();
            userRepository.save(User.builder()
                    .userId(userId)
                    .email(role + "@matrixtest.example.com")
                    .userType(userType)
                    .accountStatus("active")
                    .isEmailVerified(true)
                    .build());
            userIdByRole.put(role, userId);
        }

        return MATRIX.entrySet().stream().flatMap(entry -> {
            String permission = entry.getKey();
            Set<String> grantedRoles = entry.getValue();
            return ROLES.stream().map(role -> {
                boolean expected = grantedRoles.contains(role);
                String name = String.format("%s: %s should %s", role, permission, expected ? "have" : "NOT have");
                return DynamicTest.dynamicTest(name, () ->
                        assertThat(permissionService.hasPermission(userIdByRole.get(role), permission))
                                .as("%s -> %s", role, permission)
                                .isEqualTo(expected));
            });
        });
    }
}
