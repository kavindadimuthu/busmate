package com.busmatelk.telemetry.mqtt;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceCredential;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceCredentialRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.device.service.DeviceTokens;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * HTTP authentication webhook for the MQTT broker (IoT Platform Layer plan, Phase 4): EMQX's
 * built-in {@code password_based:http} authenticator (see {@code config/mqtt/emqx.conf}) POSTs
 * every connecting client's credentials here and only allows the connection if this returns
 * {@code {"result":"allow"}}.
 *
 * <p>Reuses exactly the same check as the HTTPS path's {@code DeviceTokenAuthenticationFilter}:
 * the MQTT {@code password} field is the device's own {@code bmt_} bearer token, hashed and looked
 * up the same way — one device identity, two transports. {@code username}/{@code clientid} are
 * accepted but not otherwise checked (the token alone is authoritative, matching the HTTPS path).
 *
 * <p><b>Under {@code /internal/**}</b> — never routed by api-gateway (which hard-blocks
 * {@code /internal/**}, see its {@code app.ts}) and reachable only on the Docker-internal network
 * between EMQX and this service, the same trust boundary the rest of the stack's
 * service-to-service calls rely on. {@code permitAll} in {@code SecurityConfig} since the broker
 * has no user-service JWT to present.
 */
@RestController
@RequestMapping("/internal/mqtt-auth")
@RequiredArgsConstructor
public class MqttAuthController {

    private final DeviceCredentialRepository credentialRepository;
    private final DeviceRepository deviceRepository;

    @PostMapping
    public ResponseEntity<Map<String, String>> authenticate(@RequestBody MqttAuthRequest request) {
        if (request.getPassword() == null || !request.getPassword().startsWith("bmt_")) {
            return deny();
        }

        Optional<DeviceCredential> credential =
                credentialRepository.findActiveBySecretHash(DeviceTokens.hash(request.getPassword()), Instant.now());
        if (credential.isEmpty()) {
            return deny();
        }

        Optional<Device> device = deviceRepository.findById(credential.get().getDeviceId());
        if (device.isEmpty() || device.get().getStatus() == DeviceStatus.DISABLED
                || device.get().getStatus() == DeviceStatus.RETIRED) {
            return deny();
        }

        return allow();
    }

    private ResponseEntity<Map<String, String>> allow() {
        return ResponseEntity.ok(Map.of("result", "allow"));
    }

    private ResponseEntity<Map<String, String>> deny() {
        return ResponseEntity.ok(Map.of("result", "deny"));
    }

    @Data
    public static class MqttAuthRequest {
        private String username;
        private String password;
        private String clientid;
    }
}
