package com.busmatelk.telemetry.mqtt;

import com.busmatelk.telemetry.ingest.IngestService;
import com.busmatelk.telemetry.ingest.dto.AlertIngestRequest;
import com.busmatelk.telemetry.ingest.dto.VehicleTelemetryIngestRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.validation.Validation;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * INC-023: the MQTT adapter routes vehicle events into the same ingest pipeline as HTTPS. Plain unit
 * test — the adapter's dispatch needs no broker; its message handling is what is under test. (EMQX
 * itself is exercised by the broker-auth test and the pilot runbook, not here.)
 */
@DisplayName("INC-023 MQTT vehicle event dispatch")
class MqttVehicleIngestTest {

    private final UUID deviceId = UUID.randomUUID();
    private IngestService ingestService;
    private SimpleMeterRegistry meters;
    private MqttIngestAdapter adapter;

    @BeforeEach
    void setUp() {
        ingestService = mock(IngestService.class);
        meters = new SimpleMeterRegistry();
        adapter = new MqttIngestAdapter(
                ingestService,
                new ObjectMapper().findAndRegisterModules(),
                Validation.buildDefaultValidatorFactory().getValidator(),
                meters,
                false, "tcp://unused:1883", "test", "test", "test");
    }

    private void publish(String eventType, String json) {
        adapter.messageArrived("devices/" + deviceId + "/telemetry/" + eventType,
                new MqttMessage(json.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("INC-023: a vehicle-telemetry message is dispatched with the mqtt adapter tag")
    void vehicleTelemetryDispatched() {
        publish("vehicle-telemetry",
                "{\"deviceTimestamp\":\"2026-09-19T08:31:02Z\",\"payload\":{\"ignition\":true,\"fuel\":{\"levelPct\":61.5}}}");

        ArgumentCaptor<VehicleTelemetryIngestRequest> request = ArgumentCaptor.forClass(VehicleTelemetryIngestRequest.class);
        verify(ingestService).ingestVehicleTelemetry(eq(deviceId), request.capture(), eq(IngestService.ADAPTER_MQTT));
        assertThat(request.getValue().getPayload().getFuel().getLevelPct()).isEqualTo(61.5);
    }

    @Test
    @DisplayName("INC-023: an alert message is dispatched with the mqtt adapter tag")
    void alertDispatched() {
        publish("alert",
                "{\"deviceTimestamp\":\"2026-09-19T08:31:02Z\",\"payload\":{\"code\":\"LOW_FUEL\",\"state\":\"raised\",\"severity\":\"warning\"}}");

        ArgumentCaptor<AlertIngestRequest> request = ArgumentCaptor.forClass(AlertIngestRequest.class);
        verify(ingestService).ingestAlert(eq(deviceId), request.capture(), eq(IngestService.ADAPTER_MQTT));
        assertThat(request.getValue().getPayload().getCode()).isEqualTo("LOW_FUEL");
    }

    @Test
    @DisplayName("INC-023: a structurally invalid message is not ingested and is counted as a parse error")
    void invalidMessageCounted() {
        publish("vehicle-telemetry",
                "{\"deviceTimestamp\":\"2026-09-19T08:31:02Z\",\"payload\":{\"ignition\":true,\"fuel\":{\"levelPct\":140}}}");
        publish("alert",
                "{\"deviceTimestamp\":\"2026-09-19T08:31:02Z\",\"payload\":{\"code\":\"low fuel\",\"state\":\"raised\",\"severity\":\"warning\"}}");

        verify(ingestService, never()).ingestVehicleTelemetry(any(), any(), any());
        verify(ingestService, never()).ingestAlert(any(), any(), any());
        assertThat(meters.get("telemetry.ingest.events").tag("outcome", "parse_error").counter().count()).isEqualTo(2.0);
    }
}
