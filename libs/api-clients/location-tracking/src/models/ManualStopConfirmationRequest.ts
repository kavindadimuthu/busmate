/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Manual stop confirmation request
 */
export type ManualStopConfirmationRequest = {
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
    eventType: ManualStopConfirmationRequest.eventType;
    /**
     * Location of event
     */
    location?: GeoJSONPoint;
    /**
     * Person confirming
     */
    confirmedBy: string;
    /**
     * Passenger count
     */
    passengerCount?: number;
    /**
     * Additional notes
     */
    notes?: string;
};
export namespace ManualStopConfirmationRequest {
    /**
     * Event type
     */
    export enum eventType {
        ARRIVAL = 'arrival',
        DEPARTURE = 'departure',
    }
}

