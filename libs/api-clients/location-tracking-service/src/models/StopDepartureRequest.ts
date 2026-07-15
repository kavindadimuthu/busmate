/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Stop departure request
 */
export type StopDepartureRequest = {
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Stop identifier
     */
    stopId: string;
    /**
     * Location of departure
     */
    location?: GeoJSONPoint;
    /**
     * Departure timestamp
     */
    timestamp?: string;
    /**
     * Manual confirmation flag
     */
    isManual?: boolean;
    /**
     * Person who confirmed
     */
    confirmedBy?: string;
    /**
     * Dwell time in minutes
     */
    dwellTimeMinutes?: number;
    /**
     * Passenger count
     */
    passengerCount?: number;
    /**
     * Additional notes
     */
    notes?: string;
};

