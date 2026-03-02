/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
import type { PassengerNearbyStop } from './PassengerNearbyStop';
export type PassengerNearbyStopsResponse = {
    stops?: Array<PassengerNearbyStop>;
    totalFound?: number;
    searchRadius?: number;
    userLocation?: LocationDto;
};

