/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusResult } from './BusResult';
import type { StopInfo } from './StopInfo';
/**
 * Response containing buses/routes found between two stops
 */
export type FindMyBusResponse = {
    /**
     * Whether the search was successful
     */
    success?: boolean;
    /**
     * Message providing additional context
     */
    message?: string;
    /**
     * Origin stop information
     */
    fromStop?: StopInfo;
    /**
     * Destination stop information
     */
    toStop?: StopInfo;
    /**
     * Date for which results are provided
     */
    searchDate?: string;
    /**
     * Time from which results are filtered
     */
    searchTime?: string;
    /**
     * Total number of results found
     */
    totalResults?: number;
    /**
     * List of bus/route results sorted by departure time or distance
     */
    results?: Array<BusResult>;
};

