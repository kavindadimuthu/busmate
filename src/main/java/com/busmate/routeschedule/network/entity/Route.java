package com.busmate.routeschedule.network.entity;

import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.shared.entity.BaseEntity;

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
    private String name; // English name (primary)

    @Column(name = "name_sinhala")
    private String nameSinhala;

    @Column(name = "name_tamil")
    private String nameTamil;

    @Column(name = "route_number")
    private String routeNumber;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "road_type")
    private RoadTypeEnum roadType;

    @Column(name = "route_through")
    private String routeThrough; // English (primary)

    @Column(name = "route_through_sinhala")
    private String routeThroughSinhala;

    @Column(name = "route_through_tamil")
    private String routeThroughTamil;

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
