package com.busmate.routeschedule.shared.dto;

import lombok.Data;

@Data
public class LocationDto {
    private Double latitude;
    private Double longitude;
    
    // English fields (primary)
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    
    // Sinhala fields
    private String addressSinhala;
    private String citySinhala;
    private String stateSinhala;
    private String countrySinhala;
    
    // Tamil fields
    private String addressTamil;
    private String cityTamil;
    private String stateTamil;
    private String countryTamil;
}
