package com.busmate.routeschedule.entity;

import com.busmate.routeschedule.enums.TripStatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "trip")
public class Trip extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "assignment_id", nullable = false)
    private PassengerServicePermitScheduleAssignment assignment;

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