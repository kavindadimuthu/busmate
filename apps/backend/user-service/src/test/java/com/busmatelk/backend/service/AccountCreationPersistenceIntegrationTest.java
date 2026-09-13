package com.busmatelk.backend.service;

import com.busmatelk.backend.AbstractPostgresIntegrationTest;
import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.request.RegisterRequest;
import com.busmatelk.backend.dto.response.RegisterResponse;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.AuthCredentialRepository;
import com.busmatelk.backend.repository.UserIdentityRepository;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * INC-004: creating an account must leave every record that account is supposed to have.
 *
 * <p>These assert on what reached the database rather than on what the method returned, because
 * the defect being guarded against was invisible from the response — registration answered with a
 * real user id and a success status while two of its four writes had been discarded.
 *
 * <p>The cause was a bulk {@code @Modifying} query marked {@code clearAutomatically} without
 * {@code flushAutomatically}: issuing the verification-email token cleared the persistence context
 * and threw away the still-unflushed identity and profile inserts. Anything that happens to have
 * been flushed already survived, which is why the user and credential rows were always present and
 * the failure looked arbitrary.
 */
@SpringBootTest
class AccountCreationPersistenceIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private AuthService authService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserTypeRepository userTypeRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserIdentityRepository userIdentityRepository;
    @Autowired
    private AuthCredentialRepository authCredentialRepository;

    @Test
    void inc004_selfRegistrationPersistsUserCredentialIdentityAndProfile() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(uniqueEmail("self-register"));
        request.setPassword("TestPassw0rd!23");
        request.setFullName("Self Registered");

        RegisterResponse response = authService.registerPassenger(request);

        assertEveryAccountRecordExists(response.getUserId());
    }

    @Test
    void inc004_privilegedUserCreationPersistsUserCredentialIdentityAndProfile() {
        UUID adminId = createAdmin();

        CreateUserRequest request = new CreateUserRequest();
        request.setEmail(uniqueEmail("privileged-create"));
        request.setPassword("TestPassw0rd!23");
        request.setFullName("Created By Admin");
        request.setUserType("mot");
        Map<String, Object> profileData = new HashMap<>();
        profileData.put("employee_id", "EMP-INC004");
        request.setProfileData(profileData);

        RegisterResponse response = authService.createUser(request, adminId);

        assertEveryAccountRecordExists(response.getUserId());
    }

    private void assertEveryAccountRecordExists(UUID userId) {
        assertThat(userRepository.findById(userId))
                .as("user record for %s", userId).isPresent();
        assertThat(authCredentialRepository.findById(userId))
                .as("password credential for %s", userId).isPresent();
        assertThat(userIdentityRepository.findByUserId(userId))
                .as("local identity for %s", userId).isNotEmpty();
        assertThat(userProfileRepository.findByUserUserId(userId))
                .as("profile for %s", userId).isPresent();
    }

    private UUID createAdmin() {
        UserType admin = userTypeRepository.findByName("admin").orElseThrow();
        UUID adminId = UUID.randomUUID();
        userRepository.save(User.builder()
                .userId(adminId)
                .email(uniqueEmail("admin"))
                .userType(admin)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        return adminId;
    }

    private static String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@inc004.example.com";
    }
}
