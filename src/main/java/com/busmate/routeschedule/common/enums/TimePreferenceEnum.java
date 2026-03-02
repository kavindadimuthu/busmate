package com.busmate.routeschedule.common.enums;

/**
 * Enum representing user preferences for time data in schedule queries.
 * 
 * This determines which time values (verified, unverified, or calculated) 
 * should be used when querying bus schedules.
 * 
 * Time Selection Priority:
 * - VERIFIED_ONLY: Only use verified times (arrivalTime, departureTime)
 * - PREFER_UNVERIFIED: Verified > Unverified (fallback to unverified if verified not available)
 * - PREFER_CALCULATED: Verified > Unverified > Calculated (full fallback chain)
 * - DEFAULT: Same as PREFER_CALCULATED (most comprehensive)
 */
public enum TimePreferenceEnum {
    
    /**
     * Only use verified times. If verified times are not available,
     * the result will have null times for that field.
     */
    VERIFIED_ONLY,
    
    /**
     * Prefer verified times, but fallback to unverified times if verified not available.
     * Will NOT use calculated times even if unverified is not available.
     */
    PREFER_UNVERIFIED,
    
    /**
     * Use verified times if available, otherwise unverified times,
     * and finally calculated times as the last resort.
     * This provides the most comprehensive data coverage.
     */
    PREFER_CALCULATED,
    
    /**
     * Default behavior - same as PREFER_CALCULATED.
     * Uses the full fallback chain: Verified > Unverified > Calculated.
     */
    DEFAULT
}
