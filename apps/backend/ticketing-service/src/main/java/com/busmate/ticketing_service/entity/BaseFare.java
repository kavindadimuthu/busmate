package com.busmate.ticketing_service.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "base_fare")

@AllArgsConstructor
@NoArgsConstructor
@Data

public class BaseFare {
    @Id
    @Column(name = "section")
    private int section;

    @Column(name = "normal_fare",nullable = false)
    private double normalFare;

    @Column(name = "semi_luxury_fare")
    private Double semiLuxuryFare;

    @Column(name = "luxury_fare")
    private Double luxuryFare;

    @Column(name = "super_luxury_fare")
    private Double superLuxuryFare;

    @Column(name = "expressway_super_luxury_fare")
    private Double expresswaySuperLuxuryFare;


}
