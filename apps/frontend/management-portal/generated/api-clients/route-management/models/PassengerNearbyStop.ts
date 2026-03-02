/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
import type { PassengerUpcomingTrip } from './PassengerUpcomingTrip';
export type PassengerNearbyStop = {
    stopId?: string;
    name?: string;
    city?: string;
    location?: LocationDto;
    distance?: number;
    distanceUnit?: string;
    isAccessible?: boolean;
    facilities?: Array<string>;
    routeCount?: number;
    operatorCount?: number;
    upcomingTrips?: Array<PassengerUpcomingTrip>;
};

