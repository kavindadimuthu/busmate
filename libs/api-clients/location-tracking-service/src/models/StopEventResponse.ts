/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Stop event response
 */
export type StopEventResponse = {
    /**
     * Event identifier
     */
    eventId: string;
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Stop identifier
     */
    stopId: string;
    /**
     * Event type
     */
    eventType: StopEventResponse.eventType;
    /**
     * Event timestamp
     */
    timestamp: string;
    /**
     * Location of event
     */
    location?: GeoJSONPoint;
    /**
     * Manual confirmation flag
     */
    isManual: boolean;
    /**
     * Person who confirmed (if manual)
     */
    confirmedBy?: string;
    /**
     * Processing details
     */
    processingDetails?: {
        /**
         * Any validation warnings
         */
        warnings?: Array<string>;
        /**
         * On-time status
         */
        onTime?: boolean;
        /**
         * Delay from schedule
         */
        delayMinutes?: number;
    };
};
export namespace StopEventResponse {
    /**
     * Event type
     */
    export enum eventType {
        ARRIVAL = 'arrival',
        DEPARTURE = 'departure',
    }
}

