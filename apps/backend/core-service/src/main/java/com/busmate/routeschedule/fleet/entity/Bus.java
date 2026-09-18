package com.busmate.routeschedule.fleet.entity;

import com.busmate.routeschedule.fleet.enums.BusAvailabilityEnum;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import java.time.LocalDate;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Type;
import java.util.UUID;
import com.busmate.routeschedule.shared.entity.BaseEntity;
import com.busmate.routeschedule.fleet.entity.Operator;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "bus")
public class Bus extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @Column(name = "ntc_registration_number", nullable = false, unique = true)
    private String ntcRegistrationNumber;

    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;

    @Column(nullable = false)
    private Integer capacity;

    @Column
    private String model;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode facilities;

    // Structured seat layout of the bus (rows of left/right/back seat-id arrays + blocked seats).
    // A value object owned by the Bus aggregate, stored as jsonb like `facilities`. Nullable:
    // when absent, the service layer returns a default 2+2 layout derived from `capacity`.
    @Type(JsonType.class)
    @Column(name = "seat_layout", columnDefinition = "jsonb")
    private JsonNode seatLayout;

    // The fare tier this bus is charged at (INC-011). Recorded, never inferred from `facilities`:
    // ticketing-service prices a journey from this, so a guess here is a wrong fare.
    @Enumerated(EnumType.STRING)
    @Column(name = "service_class", nullable = false)
    private ServiceClassEnum serviceClass = ServiceClassEnum.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusEnum status;

    // Why MOT suspended or the operator retired the bus (INC-018); null while active.
    @Column(name = "status_reason", length = 500)
    private String statusReason;

    @Column(name = "manufacture_year")
    private Integer manufactureYear;

    @Column(name = "chassis_number", length = 64)
    private String chassisNumber;

    @Column(name = "engine_number", length = 64)
    private String engineNumber;

    // Day-to-day availability, separate from `status` (design R3). A non-AVAILABLE value applies
    // from availabilityFrom until availabilityUntil, both inclusive; a null end means "until
    // further notice".
    @Enumerated(EnumType.STRING)
    @Column(name = "availability", nullable = false)
    private BusAvailabilityEnum availability = BusAvailabilityEnum.AVAILABLE;

    @Column(name = "availability_from")
    private LocalDate availabilityFrom;

    @Column(name = "availability_until")
    private LocalDate availabilityUntil;

    @Column(name = "availability_note", length = 500)
    private String availabilityNote;

    /** Whether the operator has the bus available on {@code date}. */
    public boolean isAvailableOn(LocalDate date) {
        if (availability == null || availability == BusAvailabilityEnum.AVAILABLE) {
            return true;
        }
        boolean started = availabilityFrom == null || !date.isBefore(availabilityFrom);
        boolean notEnded = availabilityUntil == null || !date.isAfter(availabilityUntil);
        return !(started && notEnded);
    }
}
