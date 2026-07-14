package com.busmate.routeschedule.scheduling.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;
import java.util.UUID;
import com.busmate.routeschedule.network.entity.RouteStop;

@Data
@Entity
@Table(name = "schedule_stop")
public class ScheduleStop {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @ManyToOne
    @JoinColumn(name = "route_stop_id", nullable = false)
    private RouteStop routeStop;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Column(name = "arrival_time_unverified")
    private LocalTime arrivalTimeUnverified;

    @Column(name = "departure_time_unverified")
    private LocalTime departureTimeUnverified;

    @Column(name = "arrival_time_unverified_by")
    private String arrivalTimeUnverifiedBy;

    @Column(name = "departure_time_unverified_by")
    private String departureTimeUnverifiedBy;

    @Column(name = "arrival_time_calculated")
    private LocalTime arrivalTimeCalculated;

    @Column(name = "departure_time_calculated")
    private LocalTime departureTimeCalculated;
}
