package com.busmate.routeschedule.network.repository.projection;

/**
 * Projection interface for duration range (min/max).
 * Used to return duration range data without manual array casting.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface DurationRange {
    /**
     * @return Minimum estimated duration in minutes
     */
    Integer getMin();
    
    /**
     * @return Maximum estimated duration in minutes
     */
    Integer getMax();
}
