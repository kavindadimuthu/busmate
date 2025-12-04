package com.busmate.routeschedule.entity;

import com.busmate.routeschedule.enums.DirectionEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "route")
public class Route extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @ManyToOne
    @JoinColumn(name = "route_group_id")
    private RouteGroup routeGroup;

    @Column(name = "start_stop_id", columnDefinition = "UUID")
    private UUID startStopId;

    @Column(name = "end_stop_id", columnDefinition = "UUID")
    private UUID endStopId;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction")
    private DirectionEnum direction;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RouteStop> routeStops;
}
