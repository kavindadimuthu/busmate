package com.busmatelk.telemetry.fleethealth;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the fleet-health silence detection (IoT Platform Layer plan, Phase 3) —
 * plain Mockito, no Spring context, since the job's logic is pure: read candidates, flip
 * {@code silenceFlaggedAt}, publish. The DB queries themselves are exercised for real by
 * {@code DeviceControllerIntegrationTest}'s Postgres-backed suite; this test isolates the job's
 * own decision logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Fleet Health Monitor Job")
class FleetHealthMonitorJobTest {

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private FleetHealthMonitorJob job;

    @BeforeEach
    void setUp() {
        job = new FleetHealthMonitorJob(deviceRepository, kafkaTemplate, "iot.device-status.v1", 5);
    }

    private void stubSend() {
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(null));
    }

    @Test
    @DisplayName("flags an ACTIVE device that has gone silent past the threshold")
    void flagsSilentDevice() {
        Device device = Device.builder()
                .id(UUID.randomUUID())
                .serialNumber("GPS-TEST-01")
                .status(DeviceStatus.ACTIVE)
                .lastSeenAt(Instant.now().minus(10, ChronoUnit.MINUTES))
                .build();

        when(deviceRepository.findByStatusAndLastSeenAtBeforeAndSilenceFlaggedAtIsNull(any(), any()))
                .thenReturn(List.of(device));
        when(deviceRepository.findRecoveredSinceFlagged()).thenReturn(List.of());
        stubSend();

        job.checkFleetHealth();

        assertThat(device.getSilenceFlaggedAt()).isNotNull();
        verify(deviceRepository).save(device);

        ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
        verify(kafkaTemplate).send(anyString(), anyString(), payloadCaptor.capture());
    }

    @Test
    @DisplayName("un-flags a device that has reported again since being flagged")
    void unflagsRecoveredDevice() {
        Device device = Device.builder()
                .id(UUID.randomUUID())
                .serialNumber("GPS-TEST-02")
                .status(DeviceStatus.ACTIVE)
                .lastSeenAt(Instant.now())
                .silenceFlaggedAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(deviceRepository.findByStatusAndLastSeenAtBeforeAndSilenceFlaggedAtIsNull(any(), any()))
                .thenReturn(List.of());
        when(deviceRepository.findRecoveredSinceFlagged()).thenReturn(List.of(device));
        stubSend();

        job.checkFleetHealth();

        assertThat(device.getSilenceFlaggedAt()).isNull();
        verify(deviceRepository).save(device);
        verify(kafkaTemplate, times(1)).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("does nothing when the fleet is healthy")
    void noOpWhenFleetHealthy() {
        when(deviceRepository.findByStatusAndLastSeenAtBeforeAndSilenceFlaggedAtIsNull(any(), any()))
                .thenReturn(List.of());
        when(deviceRepository.findRecoveredSinceFlagged()).thenReturn(List.of());

        job.checkFleetHealth();

        verify(deviceRepository, times(0)).save(any());
        verify(kafkaTemplate, times(0)).send(anyString(), anyString(), any());
    }
}
