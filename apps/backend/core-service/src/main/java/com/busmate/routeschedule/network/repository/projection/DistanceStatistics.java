package com.busmate.routeschedule.network.repository.projection;

/**
 * Projection interface for distance-related statistics.
 * Used to return aggregated distance data without manual array casting.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface DistanceStatistics {
    /**
     * @return Average distance in kilometers across all routes
     */
    Double getAvg();
    
    /**
     * @return Minimum distance in kilometers
     */
    Double getMin();
    
    /**
     * @return Maximum distance in kilometers
     */
    Double getMax();
    
    /**
     * @return Total/sum of all distances in kilometers
     */
    Double getSum();
}
