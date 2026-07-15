/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeoJSONPoint } from './GeoJSONPoint';
/**
 * Location update request
 */
export type LocationUpdateRequest = {
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
     * GPS location
     */
    location: GeoJSONPoint;
    /**
     * Timestamp of location update
     */
    timestamp?: string;
    /**
     * Speed in km/h
     */
    speed?: number;
    /**
     * GPS accuracy in meters
     */
    accuracy?: number;
    /**
     * Heading in degrees (0-360)
     */
    heading?: number;
    /**
     * Altitude in meters
     */
    altitude?: number;
};

