package com.busmate.routeschedule.network.repository.projection;

/**
 * Projection interface for route count by route group.
 * Used to return aggregated counts without manual array casting.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface RouteGroupCount {
    /**
     * @return The route group name
     */
    String getRouteGroupName();
    
    /**
     * @return Number of routes in this route group
     */
    Long getCount();
}
