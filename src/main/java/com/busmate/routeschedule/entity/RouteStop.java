package com.busmate.routeschedule.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "route_stop")
public class RouteStop {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne
    @JoinColumn(name = "stop_id", nullable = false)
    private Stop stop;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "distance_from_start_km")
    private Double distanceFromStartKm;

    @OneToMany(mappedBy = "routeStop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleStop> scheduleStops;
}
