package com.busmate.routeschedule.shared.config;

import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Database configuration and health monitoring for handling Supabase connection issues
 */
@Configuration
@EnableRetry
@Slf4j
public class DatabaseConfig {

    /**
     * Custom health indicator for database connectivity monitoring
     */
    @Component
    public static class DatabaseHealthIndicator implements HealthIndicator {

        @Autowired
        private DataSource dataSource;

        @Override
        @Retry(name = "database", fallbackMethod = "fallbackHealth")
        public Health health() {
            try (Connection connection = dataSource.getConnection()) {
                if (connection.isValid(5)) {
                    return Health.up()
                            .withDetail("database", "PostgreSQL")
                            .withDetail("status", "Connected")
                            .withDetail("pool", "HikariCP")
                            .build();
                } else {
                    return Health.down()
                            .withDetail("database", "PostgreSQL")
                            .withDetail("status", "Connection Invalid")
                            .build();
                }
            } catch (SQLException e) {
                log.error("Database health check failed: {}", e.getMessage());
                return Health.down(e)
                        .withDetail("database", "PostgreSQL")
                        .withDetail("status", "Connection Failed")
                        .withDetail("error", e.getMessage())
                        .build();
            }
        }

        /**
         * Fallback method when all retry attempts fail
         */
        public Health fallbackHealth(Exception ex) {
            log.error("Database health check failed after retries: {}", ex.getMessage());
            return Health.down()
                    .withDetail("database", "PostgreSQL")
                    .withDetail("status", "All retry attempts failed")
                    .withDetail("error", ex.getMessage())
                    .build();
        }
    }

    /**
     * Service for database operations with retry capability
     */
    @Component
    public static class DatabaseService {

        @Autowired
        private JdbcTemplate jdbcTemplate;

        @Retryable(
                value = {DataAccessException.class, SQLException.class},
                maxAttempts = 3,
                backoff = @Backoff(delay = 2000, multiplier = 2)
        )
        public <T> T executeWithRetry(DatabaseOperation<T> operation) throws Exception {
            try {
                return operation.execute(jdbcTemplate);
            } catch (Exception e) {
                log.warn("Database operation failed, will retry: {}", e.getMessage());
                throw e;
            }
        }

        /**
         * Test database connectivity
         */
        @Retryable(
                value = {DataAccessException.class, SQLException.class},
                maxAttempts = 3,
                backoff = @Backoff(delay = 1000, multiplier = 2)
        )
        public boolean testConnection() {
            try {
                jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                log.info("Database connection test successful");
                return true;
            } catch (Exception e) {
                log.error("Database connection test failed: {}", e.getMessage());
                throw e;
            }
        }
    }

    /**
     * Functional interface for database operations
     */
    @FunctionalInterface
    public interface DatabaseOperation<T> {
        T execute(JdbcTemplate jdbcTemplate) throws Exception;
    }
}