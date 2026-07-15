/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Stop arrival request
 */
export type StopArrivalRequest = {
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Stop identifier
     */
    stopId: string;
    /**
     * Location of arrival
     */
    location?: GeoJSONPoint;
    /**
     * Arrival timestamp
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
     * Passenger count
     */
    passengerCount?: number;
    /**
     * Additional notes
     */
    notes?: string;
};

