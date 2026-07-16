package com.busmatelk.backend;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base class for integration tests. Boots a single, shared Postgres container (the same
 * postgres:16-alpine image the dev/prod stack uses) for the whole test run and points the
 * datasource at it via {@link DynamicPropertySource}. Tests that extend this exercise the real
 * Flyway migrations — Tier 1 (schema) and Tier 2 (RBAC reference data) — against a real Postgres,
 * removing the old H2/Hibernate-DDL divergence (see
 * docs/plans/Database-Migrations-and-Seed-Data-Plan.md, Phase 4).
 *
 * <p>The container is a static singleton started once and reused across every test class (JVM
 * shutdown reaps it via Testcontainers' Ryuk), so the suite pays the container-start cost once.
 */
public abstract class AbstractPostgresIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
