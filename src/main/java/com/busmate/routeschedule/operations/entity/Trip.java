package com.busmate.routeschedule.operations.entity;

import com.busmate.routeschedule.operations.enums.TripStatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.shared.entity.BaseEntity;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.scheduling.entity.Schedule;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "trip")
public class Trip extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "passenger_service_permit_id", nullable = true)
    private PassengerServicePermit passengerServicePermit;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;

    @Column(name = "scheduled_departure_time", nullable = false)
    private LocalTime scheduledDepartureTime;

    @Column(name = "actual_departure_time")
    private LocalTime actualDepartureTime;

    @Column(name = "scheduled_arrival_time", nullable = false)
    private LocalTime scheduledArrivalTime;

    @Column(name = "actual_arrival_time")
    private LocalTime actualArrivalTime;

    @ManyToOne
    @JoinColumn(name = "bus_id")
    private Bus bus;

    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "conductor_id")
    private UUID conductorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TripStatusEnum status;

    @Column(name = "notes")
    private String notes;
}
