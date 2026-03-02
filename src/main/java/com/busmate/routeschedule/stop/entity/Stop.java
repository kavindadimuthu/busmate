package com.busmate.routeschedule.stop.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
import java.util.UUID;
import com.busmate.routeschedule.common.entity.BaseEntity;

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
    private String name; // English name (primary)
    
    @Column(name = "name_sinhala")
    private String nameSinhala;
    
    @Column(name = "name_tamil")
    private String nameTamil;

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
        
        // English fields (primary)
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        
        // Sinhala fields
        @Column(name = "address_sinhala")
        private String addressSinhala;
        
        @Column(name = "city_sinhala")
        private String citySinhala;
        
        @Column(name = "state_sinhala")
        private String stateSinhala;
        
        @Column(name = "country_sinhala")
        private String countrySinhala;
        
        // Tamil fields
        @Column(name = "address_tamil")
        private String addressTamil;
        
        @Column(name = "city_tamil")
        private String cityTamil;
        
        @Column(name = "state_tamil")
        private String stateTamil;
        
        @Column(name = "country_tamil")
        private String countryTamil;
    }
}
