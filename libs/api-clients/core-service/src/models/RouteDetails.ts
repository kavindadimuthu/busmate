/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RouteGroupInfo } from './RouteGroupInfo';
import type { StopInfo } from './StopInfo';
/**
 * Detailed route information
 */
export type RouteDetails = {
    /**
     * Route ID
     */
    routeId?: string;
    /**
     * Route name in English
     */
    name?: string;
    /**
     * Route name in Sinhala
     */
    nameSinhala?: string;
    /**
     * Route name in Tamil
     */
    nameTamil?: string;
    /**
     * Route number
     */
    routeNumber?: string;
    /**
     * Road type
     */
    roadType?: string;
    /**
     * Route description
     */
    description?: string;
    /**
     * Route through (via) in English
     */
    routeThrough?: string;
    /**
     * Route through in Sinhala
     */
    routeThroughSinhala?: string;
    /**
     * Route through in Tamil
     */
    routeThroughTamil?: string;
    /**
     * Total route distance in km
     */
    totalDistanceKm?: number;
    /**
     * Estimated total duration in minutes
     */
    estimatedDurationMinutes?: number;
    /**
     * Route direction
     */
    direction?: string;
    /**
     * Route group information
     */
    routeGroup?: RouteGroupInfo;
    /**
     * Start stop of the route
     */
    startStop?: StopInfo;
    /**
     * End stop of the route
     */
    endStop?: StopInfo;
};

