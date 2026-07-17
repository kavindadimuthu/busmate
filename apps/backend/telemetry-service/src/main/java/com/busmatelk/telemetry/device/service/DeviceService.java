package com.busmatelk.telemetry.device.service;

import com.busmatelk.telemetry.device.dto.DeviceAssignmentResponse;
import com.busmatelk.telemetry.device.dto.DeviceRegisteredResponse;
import com.busmatelk.telemetry.device.dto.DeviceResponse;
import com.busmatelk.telemetry.device.dto.RegisterDeviceRequest;
import com.busmatelk.telemetry.device.entity.CredentialType;
import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceAssignment;
import com.busmatelk.telemetry.device.entity.DeviceCredential;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceAssignmentRepository;
import com.busmatelk.telemetry.device.repository.DeviceCredentialRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.device.repository.DeviceTypeRepository;
import com.busmatelk.telemetry.shared.exception.ConflictException;
import com.busmatelk.telemetry.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Device registry operations (IoT Platform Layer plan, Phase 1): registration with a one-time
 * ingest token, credential rotation/revocation, lifecycle transitions, and bus assignment with
 * history. Plaintext tokens leave this class exactly once — in the DeviceRegisteredResponse of
 * register/rotate — and are never persisted or logged.
 */
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final DeviceTypeRepository deviceTypeRepository;
    private final DeviceCredentialRepository credentialRepository;
    private final DeviceAssignmentRepository assignmentRepository;

    @Transactional
    public DeviceRegisteredResponse register(RegisterDeviceRequest request) {
        if (!deviceTypeRepository.existsById(request.getDeviceTypeCode())) {
            throw new IllegalArgumentException("Unknown device type: " + request.getDeviceTypeCode());
        }
        if (deviceRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new ConflictException("A device with serial number '" + request.getSerialNumber() + "' already exists");
        }

        Device device = deviceRepository.save(Device.builder()
                .serialNumber(request.getSerialNumber())
                .deviceTypeCode(request.getDeviceTypeCode())
                .label(request.getLabel())
                .status(DeviceStatus.PROVISIONED)
                .build());

        String token = issueToken(device.getId());
        return DeviceRegisteredResponse.builder()
                .device(DeviceResponse.of(device, null))
                .token(token)
                .build();
    }

    /**
     * Per-conductor self-provisioning (IoT Platform Layer plan, Phase 4) — closes Phase 2's
     * shared-credential simplification, where every conductor-mobile install reported through one
     * hardcoded demo device. Idempotent per user: a conductor who already owns a device gets a
     * freshly-rotated token for that same device (their previous install's token, if any, stops
     * working — acceptable, since re-provisioning only happens on a fresh install/logout-login);
     * a conductor with no device yet gets one created and tied to their user id.
     */
    @Transactional
    public DeviceRegisteredResponse provisionForConductor(UUID ownerUserId) {
        Device device = deviceRepository.findByOwnerUserId(ownerUserId).orElse(null);

        if (device == null) {
            device = deviceRepository.save(Device.builder()
                    .serialNumber("CONDUCTOR-APP-" + ownerUserId)
                    .deviceTypeCode("CONDUCTOR_APP")
                    .label("Conductor app (self-provisioned)")
                    .ownerUserId(ownerUserId)
                    .status(DeviceStatus.PROVISIONED)
                    .build());
        } else if (device.getStatus() == DeviceStatus.RETIRED) {
            throw new ConflictException("Your device has been retired — contact MOT/admin");
        } else if (device.getStatus() == DeviceStatus.DISABLED) {
            device.setStatus(DeviceStatus.PROVISIONED);
            device = deviceRepository.save(device);
        }

        credentialRepository.revokeActiveForDevice(device.getId(), Instant.now());
        String token = issueToken(device.getId());
        return DeviceRegisteredResponse.builder()
                .device(DeviceResponse.of(device,
                        assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(device.getId()).orElse(null)))
                .token(token)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DeviceResponse> list() {
        return deviceRepository.findAll().stream()
                .map(d -> DeviceResponse.of(d,
                        assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(d.getId()).orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public DeviceResponse get(UUID id) {
        Device device = requireDevice(id);
        return DeviceResponse.of(device,
                assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(id).orElse(null));
    }

    /** Rotate the ingest token: revoke all active credentials, issue a fresh one. */
    @Transactional
    public DeviceRegisteredResponse rotateToken(UUID id) {
        Device device = requireDevice(id);
        if (device.getStatus() == DeviceStatus.DISABLED || device.getStatus() == DeviceStatus.RETIRED) {
            throw new ConflictException("Cannot issue a token for a " + device.getStatus() + " device");
        }
        credentialRepository.revokeActiveForDevice(id, Instant.now());
        String token = issueToken(id);
        return DeviceRegisteredResponse.builder()
                .device(DeviceResponse.of(device,
                        assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(id).orElse(null)))
                .token(token)
                .build();
    }

    /** Disable a device: credentials are revoked and ingest will reject it until re-enabled + rotated. */
    @Transactional
    public DeviceResponse disable(UUID id) {
        Device device = requireDevice(id);
        device.setStatus(DeviceStatus.DISABLED);
        credentialRepository.revokeActiveForDevice(id, Instant.now());
        return DeviceResponse.of(deviceRepository.save(device),
                assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(id).orElse(null));
    }

    /** Re-enable a disabled device. A new token must still be issued via rotate. */
    @Transactional
    public DeviceResponse enable(UUID id) {
        Device device = requireDevice(id);
        if (device.getStatus() == DeviceStatus.RETIRED) {
            throw new ConflictException("A retired device cannot be re-enabled");
        }
        device.setStatus(DeviceStatus.PROVISIONED);
        return DeviceResponse.of(deviceRepository.save(device),
                assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(id).orElse(null));
    }

    @Transactional
    public DeviceAssignmentResponse assign(UUID deviceId, UUID busId, String actor) {
        Device device = requireDevice(deviceId);
        if (device.getStatus() == DeviceStatus.RETIRED) {
            throw new ConflictException("A retired device cannot be assigned");
        }
        assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(deviceId).ifPresent(a -> {
            throw new ConflictException("Device is already assigned to bus " + a.getBusId() + " — unassign first");
        });
        assignmentRepository.findByBusIdAndUnassignedAtIsNull(busId).ifPresent(a -> {
            throw new ConflictException("Bus already has device " + a.getDeviceId() + " assigned — unassign it first");
        });

        DeviceAssignment assignment = assignmentRepository.save(DeviceAssignment.builder()
                .deviceId(deviceId)
                .busId(busId)
                .createdBy(actor)
                .build());
        return DeviceAssignmentResponse.of(assignment);
    }

    @Transactional
    public DeviceAssignmentResponse unassign(UUID deviceId) {
        requireDevice(deviceId);
        DeviceAssignment assignment = assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(deviceId)
                .orElseThrow(() -> new ConflictException("Device has no active assignment"));
        assignment.setUnassignedAt(Instant.now());
        return DeviceAssignmentResponse.of(assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<DeviceAssignmentResponse> assignmentHistory(UUID deviceId) {
        requireDevice(deviceId);
        return assignmentRepository.findByDeviceIdOrderByAssignedAtDesc(deviceId).stream()
                .map(DeviceAssignmentResponse::of)
                .toList();
    }

    private Device requireDevice(UUID id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Device not found: " + id));
    }

    private String issueToken(UUID deviceId) {
        String token = DeviceTokens.generate();
        credentialRepository.save(DeviceCredential.builder()
                .deviceId(deviceId)
                .credentialType(CredentialType.TOKEN_HASH)
                .secretHash(DeviceTokens.hash(token))
                .build());
        return token;
    }
}
