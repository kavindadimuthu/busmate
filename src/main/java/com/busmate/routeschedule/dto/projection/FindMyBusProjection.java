package com.busmate.routeschedule.dto.projection;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Projection interface for Find My Bus query results.
 * Used to map native query results efficiently without loading entire entities.
 */
public interface FindMyBusProjection {
    
    // Route Information
    UUID getRouteId();
    String getRouteName();
    String getRouteNameSinhala();
    String getRouteNameTamil();
    String getRouteNumber();
    String getRoadType();
    String getRouteDescription();
    String getRouteThrough();
    String getRouteThroughSinhala();
    String getRouteThroughTamil();
    
    // Route Group Information (nullable)
    UUID getRouteGroupId();
    String getRouteGroupName();
    String getRouteGroupNameSinhala();
    String getRouteGroupNameTamil();
    
    // Route Stop Information
    UUID getFromRouteStopId();
    Integer getFromStopOrder();
    Double getFromDistanceFromStart();
    
    UUID getToRouteStopId();
    Integer getToStopOrder();
    Double getToDistanceFromStart();
    
    // Schedule Information (nullable)
    UUID getScheduleId();
    String getScheduleName();
    String getScheduleDescription();
    String getScheduleType();
    LocalDate getScheduleStartDate();
    LocalDate getScheduleEndDate();
    
    // Schedule Stop Information (nullable)
    UUID getFromScheduleStopId();
    LocalTime getFromArrivalTime();
    LocalTime getFromDepartureTime();
    
    UUID getToScheduleStopId();
    LocalTime getToArrivalTime();
    LocalTime getToDepartureTime();
    
    // Trip Information (nullable)
    UUID getTripId();
    LocalDate getTripDate();
    LocalTime getTripScheduledDepartureTime();
    LocalTime getTripActualDepartureTime();
    LocalTime getTripScheduledArrivalTime();
    LocalTime getTripActualArrivalTime();
    String getTripStatus();
    
    // Bus Information (nullable)
    UUID getBusId();
    String getBusPlateNumber();
    String getBusModel();
    
    // PSP Information (nullable)
    UUID getPspId();
    String getPspNumber();
    
    // Calendar Information (nullable)
    Boolean getMonday();
    Boolean getTuesday();
    Boolean getWednesday();
    Boolean getThursday();
    Boolean getFriday();
    Boolean getSaturday();
    Boolean getSunday();
}
