package com.busmate.routeschedule.network.repository.projection;

import java.util.UUID;

/**
 * Projection interface for route group summary data.
 * Used to return basic route group information without loading the full entity.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface RouteGroupSummary {
    /**
     * @return The route group ID
     */
    UUID getId();
    
    /**
     * @return The route group name
     */
    String getName();
}
