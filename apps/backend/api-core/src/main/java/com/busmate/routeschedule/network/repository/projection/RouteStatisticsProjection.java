package com.busmate.routeschedule.network.repository.projection;

/**
 * Spring Data projection for the consolidated route statistics native query.
 * <p>
 * All counts / sums / averages relevant to the statistics dashboard are
 * fetched in a single SQL round-trip, eliminating the per-metric individual
 * queries that previously caused 12+ database calls per statistics request.
 * </p>
 *
 * <p><b>Phase 3 – Task 3.3: Consolidate Statistics Queries</b></p>
 */
public interface RouteStatisticsProjection {

    // ─── Basic counts ────────────────────────────────────────────────────────

    /** Total number of routes across all route groups. */
    Long getTotalRoutes();

    /** Routes whose direction is {@code OUTBOUND}. */
    Long getOutboundCount();

    /** Routes whose direction is {@code INBOUND}. */
    Long getInboundCount();

    /** Routes that have at least one route-stop entry. */
    Long getRoutesWithStops();

    /** Routes that have no route-stop entries. */
    Long getRoutesWithoutStops();

    /** Number of distinct route groups that contain at least one route. */
    Long getTotalRouteGroups();

    // ─── Distance aggregates ─────────────────────────────────────────────────

    /** Average distance in km across all routes that have distance data. */
    Double getAvgDistance();

    /** Minimum distance in km. */
    Double getMinDistance();

    /** Maximum distance in km. */
    Double getMaxDistance();

    /** Sum of all distances in km. */
    Double getSumDistance();

    // ─── Duration aggregates ─────────────────────────────────────────────────

    /** Average estimated duration in minutes. */
    Double getAvgDuration();

    /** Minimum estimated duration in minutes. */
    Integer getMinDuration();

    /** Maximum estimated duration in minutes. */
    Integer getMaxDuration();

    /** Sum of all estimated durations in minutes (returned as Long to avoid overflow). */
    Long getSumDuration();
}
