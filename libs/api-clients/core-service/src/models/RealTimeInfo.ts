/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalTime } from './LocalTime';
import type { StopInfo } from './StopInfo';
/**
 * Real-time trip information
 */
export type RealTimeInfo = {
    /**
     * Current latitude of the bus
     */
    currentLatitude?: number;
    /**
     * Current longitude of the bus
     */
    currentLongitude?: number;
    /**
     * Last location update timestamp
     */
    lastUpdated?: LocalTime;
    /**
     * Current speed in km/h
     */
    speedKmh?: number;
    /**
     * Heading direction in degrees
     */
    heading?: number;
    /**
     * Last completed stop
     */
    lastStop?: StopInfo;
    /**
     * Next upcoming stop
     */
    nextStop?: StopInfo;
    /**
     * Estimated arrival at next stop
     */
    etaNextStop?: string;
    /**
     * Estimated arrival at user's origin stop
     */
    etaOrigin?: string;
    /**
     * Estimated arrival at user's destination stop
     */
    etaDestination?: string;
};

