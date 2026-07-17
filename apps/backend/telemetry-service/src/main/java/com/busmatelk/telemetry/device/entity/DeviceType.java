package com.busmatelk.telemetry.device.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Canonical device kind (reference data seeded by R__001_device_types.sql). Read-only from the
 * app's perspective — used to validate device.device_type_code and to list options in the UI.
 */
@Entity
@Table(name = "device_type")
@Getter
@Setter
@NoArgsConstructor
public class DeviceType {

    @Id
    @Column(name = "code")
    private String code;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "description")
    private String description;
}
