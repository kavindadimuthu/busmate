package com.busmate.ticketing_service.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "route_fare_section")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class RouteFare {
@Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "route_id", nullable = false)
    private String routeId;

    @Column(name = "section_id", nullable = false)
    private int sectionId;


    @Column(name = "section_name", nullable = false)
    private String sectionName;

    @Column(name = "distance_from_start", nullable = false)
    private double distanceFromStart;
}

