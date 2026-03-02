package com.busmate.routeschedule.network.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.network.entity.Stop;

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

    @Column(name = "distance_from_start_km_unverified")
    private Double distanceFromStartKmUnverified;

    @Column(name = "distance_from_start_km_calculated")
    private Double distanceFromStartKmCalculated;

    @OneToMany(mappedBy = "routeStop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleStop> scheduleStops;
}
