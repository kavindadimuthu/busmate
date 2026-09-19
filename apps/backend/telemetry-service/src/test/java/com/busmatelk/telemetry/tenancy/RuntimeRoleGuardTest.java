package com.busmatelk.telemetry.tenancy;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * INC-024: the service refuses to run as a role that could bypass row-level security. Uses the real
 * database with both roles: the restricted runtime role must pass, and the owner (a superuser here)
 * must be refused — a deploy that fell back to it would otherwise run with isolation silently off.
 */
@DisplayName("INC-024 runtime role guard")
class RuntimeRoleGuardTest extends AbstractPostgresIntegrationTest {

    private RuntimeRoleGuard guardAs(String user, String password) {
        return new RuntimeRoleGuard(new JdbcTemplate(new DriverManagerDataSource(POSTGRES.getJdbcUrl(), user, password)));
    }

    @Test
    @DisplayName("INC-024: the restricted runtime role is accepted")
    void restrictedRoleAccepted() {
        assertThatCode(() -> guardAs(APP_USER, APP_PASSWORD).afterSingletonsInstantiated()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("INC-024: the owner / superuser is refused, with a message that says how to fix it")
    void privilegedRoleRefused() {
        assertThatThrownBy(() -> guardAs(POSTGRES.getUsername(), POSTGRES.getPassword()).afterSingletonsInstantiated())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(POSTGRES.getUsername())
                .hasMessageContaining("superuser")
                .hasMessageContaining("provision-telemetry-app-role.sql")
                .hasMessageContaining("spring.flyway.user");
    }

    @Test
    @DisplayName("INC-024: each way a role can escape row-level security is reported")
    void everyEscapeIsReported() {
        assertThat(RuntimeRoleGuard.problems(false, false, 0)).isEmpty();
        assertThat(RuntimeRoleGuard.problems(true, false, 0)).containsExactly("is a superuser");
        assertThat(RuntimeRoleGuard.problems(false, true, 0)).containsExactly("has BYPASSRLS");
        assertThat(RuntimeRoleGuard.problems(false, false, 2)).containsExactly("owns the vehicle tables");
        assertThat(RuntimeRoleGuard.problems(true, true, 1)).isEqualTo(List.of("is a superuser", "has BYPASSRLS", "owns the vehicle tables"));
    }
}
