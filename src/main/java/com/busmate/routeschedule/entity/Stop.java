package com.busmate.routeschedule.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "stop")
public class Stop extends BaseEntity {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Embedded
    private Location location;

    @Column(name = "is_accessible")
    private Boolean isAccessible;

    @Embeddable
    @Data
    public static class Location {
        private Double latitude;
        private Double longitude;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String country;
    }
}