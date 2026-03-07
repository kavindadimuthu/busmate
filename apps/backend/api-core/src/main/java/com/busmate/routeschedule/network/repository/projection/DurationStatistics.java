package com.busmate.routeschedule.network.repository.projection;

/**
 * Projection interface for duration-related statistics.
 * Used to return aggregated duration data without manual array casting.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface DurationStatistics {
    /**
     * @return Average estimated duration in minutes across all routes
     */
    Double getAvg();
    
    /**
     * @return Minimum estimated duration in minutes
     */
    Integer getMin();
    
    /**
     * @return Maximum estimated duration in minutes
     */
    Integer getMax();
    
    /**
     * @return Total/sum of all durations in minutes
     */
    Long getSum();
}
