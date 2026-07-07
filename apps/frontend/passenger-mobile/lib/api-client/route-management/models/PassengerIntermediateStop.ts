/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalTime } from './LocalTime';
import type { LocationDto } from './LocationDto';
export type PassengerIntermediateStop = {
    stopId?: string;
    name?: string;
    description?: string;
    city?: string;
    location?: LocationDto;
    isAccessible?: boolean;
    facilities?: Array<string>;
    stopOrder?: number;
    distanceFromStart?: number;
    scheduledArrivalTime?: LocalTime;
    scheduledDepartureTime?: LocalTime;
    actualArrivalTime?: LocalTime;
    actualDepartureTime?: LocalTime;
    estimatedArrivalTime?: string;
    estimatedDepartureTime?: string;
    arrivalDelay?: number;
    departureDelay?: number;
    status?: string;
    /**
     * @deprecated
     */
    arrivalTime?: string;
    /**
     * @deprecated
     */
    departureTime?: string;
};

