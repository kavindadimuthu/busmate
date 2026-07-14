package com.busmate.routeschedule.network.repository.projection;

import com.busmate.routeschedule.network.enums.DirectionEnum;

/**
 * Projection interface for route count by direction.
 * Used to return aggregated counts without manual array casting.
 * 
 * This replaces the unsafe Object[] pattern with compile-time type safety.
 */
public interface DirectionCount {
    /**
     * @return The route direction (INBOUND, OUTBOUND, CIRCULAR)
     */
    DirectionEnum getDirection();
    
    /**
     * @return Number of routes with this direction
     */
    Long getCount();
}
