package com.busmate.routeschedule.enums;

/**
 * Enum indicating the source/reliability of time data in schedule responses.
 * 
 * This helps passengers understand the confidence level of the displayed times.
 */
public enum TimeSourceEnum {
    
    /**
     * Time is verified/confirmed by operators or authorities.
     * This is the most reliable time information.
     */
    VERIFIED,
    
    /**
     * Time is unverified - provided by users or unconfirmed sources.
     * May be accurate but should be treated with some caution.
     */
    UNVERIFIED,
    
    /**
     * Time is calculated based on route distance and estimated speed.
     * This is an approximation and may vary from actual times.
     */
    CALCULATED,
    
    /**
     * No time data available from any source.
     */
    UNAVAILABLE
}
