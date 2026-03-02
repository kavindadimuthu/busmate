package com.busmate.routeschedule.passengerinfo.dto.projection;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Projection interface for Schedule Stop details in Find My Bus Details query.
 * Maps native query results for all schedule stops with comprehensive timing information.
 */
public interface ScheduleStopDetailsProjection {
    
    // Schedule Stop Information
    UUID getScheduleStopId();
    Integer getStopOrder();
    
    // Stop Information
    UUID getStopId();
    String getStopName();
    String getStopNameSinhala();
    String getStopNameTamil();
    String getStopDescription();
    Double getStopLatitude();
    Double getStopLongitude();
    String getStopAddress();
    String getStopCity();
    Boolean getStopIsAccessible();
    
    // Route Stop Information
    UUID getRouteStopId();
    Double getDistanceFromStartKm();
    Double getDistanceFromStartKmUnverified();
    Double getDistanceFromStartKmCalculated();
    
    // Verified times
    LocalTime getArrivalTime();
    LocalTime getDepartureTime();
    
    // Unverified times
    LocalTime getArrivalTimeUnverified();
    LocalTime getDepartureTimeUnverified();
    
    // Calculated times
    LocalTime getArrivalTimeCalculated();
    LocalTime getDepartureTimeCalculated();
}
