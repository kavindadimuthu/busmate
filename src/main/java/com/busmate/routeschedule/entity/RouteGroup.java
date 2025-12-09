package com.busmate.routeschedule.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "route_group")
public class RouteGroup extends BaseEntity {
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

    @Column
    private String description;

    @OneToMany(mappedBy = "routeGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Route> routes;
}
