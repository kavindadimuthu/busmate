/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Trip tracking response
 */
export type TripTrackingResponse = {
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Current status
     */
    status: TripTrackingResponse.status;
    /**
     * Status change timestamp
     */
    statusChangedAt: string;
    /**
     * Associated device
     */
    deviceId: string;
    /**
     * Associated bus
     */
    busId: string;
    /**
     * Trip details
     */
    tripDetails?: {
        /**
         * Current location
         */
        currentLocation?: GeoJSONPoint;
        /**
         * End time
         */
        endedAt?: string;
        /**
         * Start time
         */
        startedAt?: string;
        /**
         * Schedule identifier
         */
        scheduleId: string;
        /**
         * Route identifier
         */
        routeId: string;
    };
};
export namespace TripTrackingResponse {
    /**
     * Current status
     */
    export enum status {
        ACTIVE = 'active',
        PAUSED = 'paused',
        COMPLETED = 'completed',
        CANCELLED = 'cancelled',
    }
}

