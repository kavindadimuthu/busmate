package com.busmatelk.telemetry;

import org.flywaydb.core.Flyway;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Base class for integration tests. Boots a single, shared Postgres container (the same
 * postgres:16-alpine image the dev/prod stack uses) for the whole test run and points the
 * datasource at it via {@link DynamicPropertySource}. Tests that extend this exercise the real
 * Flyway migrations against a real Postgres — the same pattern the other backend services use
 * (see docs/plans/Database-Migrations-and-Seed-Data-Plan.md Phase 4).
 *
 * <p>Two database roles, exactly as in dev and production (INC-024, ADR-016). Migrations run as the
 * container's superuser, which owns the tables. The application itself connects as
 * {@value #APP_USER}, a restricted login role that is neither a superuser nor the owner and cannot
 * bypass row-level security — so every test in the suite runs against the real policies, and a table
 * the service needs but the migration forgot to grant fails here, not in production.
 *
 * <p>The container is a static singleton started once and reused across every test class, so the
 * suite pays the container-start cost once.
 */
public abstract class AbstractPostgresIntegrationTest {

    protected static final String APP_USER = "busmate_telemetry_app";
    protected static final String APP_PASSWORD = "busmate_test_app";

    protected static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
        // Migrate first, as the owner, so the telemetry_app group role (created by V007) exists;
        // then create the login role that joins it — the same order as provisioning a real database.
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration", "classpath:db/reference")
                .load()
                .migrate();
        try (Connection owner = ownerConnection(); Statement statement = owner.createStatement()) {
            statement.execute("CREATE ROLE " + APP_USER + " LOGIN PASSWORD '" + APP_PASSWORD
                    + "' IN ROLE telemetry_app NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
        } catch (SQLException e) {
            throw new IllegalStateException("Could not create the runtime login role for tests", e);
        }
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", () -> APP_USER);
        registry.add("spring.datasource.password", () -> APP_PASSWORD);
        // Migrations (already applied above, so a no-op here) run as the owner, never the runtime role.
        registry.add("spring.flyway.user", POSTGRES::getUsername);
        registry.add("spring.flyway.password", POSTGRES::getPassword);
    }

    /** A connection as the table owner (a superuser here), for seeding, cleanup and DDL that the runtime role cannot do. */
    protected static Connection ownerConnection() throws SQLException {
        return DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    /** A connection as the restricted runtime role, outside Spring — for probing exactly what that role can do. */
    protected static Connection runtimeConnection() throws SQLException {
        return DriverManager.getConnection(POSTGRES.getJdbcUrl(), APP_USER, APP_PASSWORD);
    }
}
