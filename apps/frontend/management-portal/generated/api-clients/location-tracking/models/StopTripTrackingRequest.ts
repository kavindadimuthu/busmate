/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Stop trip tracking request
 */
export type StopTripTrackingRequest = {
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Ending location
     */
    endLocation?: GeoJSONPoint;
    /**
     * Reason for stopping
     */
    reason?: StopTripTrackingRequest.reason;
    /**
     * Additional notes
     */
    notes?: string;
};
export namespace StopTripTrackingRequest {
    /**
     * Reason for stopping
     */
    export enum reason {
        COMPLETED = 'completed',
        CANCELLED = 'cancelled',
    }
}

