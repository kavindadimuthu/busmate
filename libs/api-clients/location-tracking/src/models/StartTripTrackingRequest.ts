/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Start trip tracking request
 */
export type StartTripTrackingRequest = {
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Device identifier
     */
    deviceId: string;
    /**
     * Bus identifier
     */
    busId: string;
    /**
     * Schedule identifier
     */
    scheduleId: string;
    /**
     * Route identifier
     */
    routeId: string;
    /**
     * Driver identifier
     */
    driverId?: string;
    /**
     * Conductor identifier
     */
    conductorId?: string;
    /**
     * Starting location
     */
    startLocation?: GeoJSONPoint;
};

