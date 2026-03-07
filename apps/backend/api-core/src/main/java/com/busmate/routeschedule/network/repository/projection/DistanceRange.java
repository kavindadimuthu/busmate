package com.busmate.routeschedule.network.repository.projection;

/**
 * Projection interface for distance range (min/max).
 * Used to return distance range data without manual array casting.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface DistanceRange {
    /**
     * @return Minimum distance in kilometers
     */
    Double getMin();
    
    /**
     * @return Maximum distance in kilometers
     */
    Double getMax();
}
