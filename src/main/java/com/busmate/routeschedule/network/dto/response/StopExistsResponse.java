package com.busmate.routeschedule.network.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for stop existence check.
 * Returns whether a stop exists and the stop data if found.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StopExistsResponse {
    
    /**
     * Indicates whether the stop exists in the system
     */
    private boolean exists;
    
    /**
     * The stop data if found, null otherwise
     */
    private StopResponse stop;
    
    /**
     * The search criteria used to find the stop
     */
    private String searchedBy;
    
    /**
     * The search value used
     */
    private String searchValue;
    
    /**
     * Create a response for when a stop is found
     */
    public static StopExistsResponse found(StopResponse stop, String searchedBy, String searchValue) {
        return StopExistsResponse.builder()
                .exists(true)
                .stop(stop)
                .searchedBy(searchedBy)
                .searchValue(searchValue)
                .build();
    }
    
    /**
     * Create a response for when a stop is not found
     */
    public static StopExistsResponse notFound(String searchedBy, String searchValue) {
        return StopExistsResponse.builder()
                .exists(false)
                .stop(null)
                .searchedBy(searchedBy)
                .searchValue(searchValue)
                .build();
    }
}
