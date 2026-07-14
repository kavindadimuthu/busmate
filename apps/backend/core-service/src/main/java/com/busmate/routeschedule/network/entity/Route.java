package com.busmate.routeschedule.network.entity;

import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import com.busmate.routeschedule.shared.entity.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;
import lombok.EqualsAndHashCode;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "start_stop_id")
    private Stop startStop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_stop_id")
    private Stop endStop;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction")
    private DirectionEnum direction;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RouteStop> routeStops;
    
    // Transient getters for backward compatibility during migration
    @Transient
    public UUID getStartStopId() {
        return startStop != null ? startStop.getId() : null;
    }
    
    @Transient
    public UUID getEndStopId() {
        return endStop != null ? endStop.getId() : null;
    }
    
    // Transient setters for backward compatibility during migration
    @Transient
    public void setStartStopId(UUID startStopId) {
        if (startStopId == null) {
            this.startStop = null;
        } else if (this.startStop == null || !startStopId.equals(this.startStop.getId())) {
            // Create a minimal Stop proxy with just the ID
            // Hibernate will handle loading the full entity when needed
            Stop stop = new Stop();
            stop.setId(startStopId);
            this.startStop = stop;
        }
    }
    
    @Transient
    public void setEndStopId(UUID endStopId) {
        if (endStopId == null) {
            this.endStop = null;
        } else if (this.endStop == null || !endStopId.equals(this.endStop.getId())) {
            // Create a minimal Stop proxy with just the ID
            // Hibernate will handle loading the full entity when needed
            Stop stop = new Stop();
            stop.setId(endStopId);
            this.endStop = stop;
        }
    }
}
