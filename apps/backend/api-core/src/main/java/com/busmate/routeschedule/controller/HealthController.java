package com.busmate.routeschedule.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Tag(name = "11. Health Check", description = "APIs for service health monitoring and status checks")
public class HealthController implements HealthIndicator {

    private final DataSource dataSource;

    @GetMapping
    @Operation(
        summary = "Basic health check", 
        description = "Returns basic service health status - useful for load balancers and monitoring systems",
        operationId = "getBasicHealth"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service is healthy"),
        @ApiResponse(responseCode = "503", description = "Service is unhealthy")
    })
    public ResponseEntity<Map<String, Object>> getBasicHealth() {
        try {
            Map<String, Object> healthInfo = new HashMap<>();
            healthInfo.put("status", "UP");
            healthInfo.put("timestamp", LocalDateTime.now());
            healthInfo.put("service", "route-management-service");
            
            return ResponseEntity.ok(healthInfo);
        } catch (Exception e) {
            log.error("Health check failed", e);
            Map<String, Object> healthInfo = new HashMap<>();
            healthInfo.put("status", "DOWN");
            healthInfo.put("timestamp", LocalDateTime.now());
            healthInfo.put("error", e.getMessage());
            
            return ResponseEntity.status(503).body(healthInfo);
        }
    }

    @GetMapping("/ready")
    @Operation(
        summary = "Readiness check", 
        description = "Returns detailed readiness status including database connectivity - useful for Kubernetes readiness probes",
        operationId = "getReadinessCheck"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service is ready"),
        @ApiResponse(responseCode = "503", description = "Service is not ready")
    })
    public ResponseEntity<Map<String, Object>> getReadinessCheck() {
        Map<String, Object> readinessInfo = new HashMap<>();
        readinessInfo.put("timestamp", LocalDateTime.now());
        readinessInfo.put("service", "route-management-service");
        
        boolean isReady = true;
        Map<String, Object> checks = new HashMap<>();
        
        // Database connectivity check
        try {
            testDatabaseConnection();
            checks.put("database", Map.of("status", "UP", "message", "Database connection successful"));
        } catch (Exception e) {
            log.error("Database health check failed", e);
            checks.put("database", Map.of("status", "DOWN", "message", e.getMessage()));
            isReady = false;
        }
        
        readinessInfo.put("status", isReady ? "READY" : "NOT_READY");
        readinessInfo.put("checks", checks);
        
        return ResponseEntity.status(isReady ? 200 : 503).body(readinessInfo);
    }

    @GetMapping("/live")
    @Operation(
        summary = "Liveness check", 
        description = "Returns service liveness status - useful for Kubernetes liveness probes",
        operationId = "getLivenessCheck"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service is alive"),
        @ApiResponse(responseCode = "503", description = "Service should be restarted")
    })
    public ResponseEntity<Map<String, Object>> getLivenessCheck() {
        Map<String, Object> livenessInfo = new HashMap<>();
        livenessInfo.put("status", "ALIVE");
        livenessInfo.put("timestamp", LocalDateTime.now());
        livenessInfo.put("service", "route-management-service");
        livenessInfo.put("uptime", getUptime());
        
        return ResponseEntity.ok(livenessInfo);
    }

    @GetMapping("/info")
    @Operation(
        summary = "Service information", 
        description = "Returns detailed service information including version and build details",
        operationId = "getServiceInfo"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service information retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getServiceInfo() {
        Map<String, Object> serviceInfo = new HashMap<>();
        serviceInfo.put("service", "route-management-service");
        serviceInfo.put("description", "Microservice for Bus Routes and Schedules");
        serviceInfo.put("timestamp", LocalDateTime.now());
        
        // Runtime information
        Map<String, Object> runtime = new HashMap<>();
        runtime.put("javaVersion", System.getProperty("java.version"));
        runtime.put("javaVendor", System.getProperty("java.vendor"));
        runtime.put("osName", System.getProperty("os.name"));
        runtime.put("osVersion", System.getProperty("os.version"));
        runtime.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        
        Runtime rt = Runtime.getRuntime();
        runtime.put("maxMemory", rt.maxMemory());
        runtime.put("totalMemory", rt.totalMemory());
        runtime.put("freeMemory", rt.freeMemory());
        runtime.put("usedMemory", rt.totalMemory() - rt.freeMemory());
        
        serviceInfo.put("runtime", runtime);
        
        return ResponseEntity.ok(serviceInfo);
    }

    @Override
    public Health health() {
        try {
            testDatabaseConnection();
            return Health.up()
                    .withDetail("service", "route-management-service")
                    .withDetail("database", "UP")
                    .withDetail("timestamp", LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Health check failed", e);
            return Health.down()
                    .withDetail("service", "route-management-service")
                    .withDetail("database", "DOWN")
                    .withDetail("error", e.getMessage())
                    .withDetail("timestamp", LocalDateTime.now())
                    .build();
        }
    }

    private void testDatabaseConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isValid(5)) { // 5 seconds timeout
                throw new Exception("Database connection is not valid");
            }
        }
    }

    private String getUptime() {
        long uptimeMillis = System.currentTimeMillis() - 
                           java.lang.management.ManagementFactory.getRuntimeMXBean().getStartTime();
        long uptimeSeconds = uptimeMillis / 1000;
        long hours = uptimeSeconds / 3600;
        long minutes = (uptimeSeconds % 3600) / 60;
        long seconds = uptimeSeconds % 60;
        
        return String.format("%dh %dm %ds", hours, minutes, seconds);
    }
}
