/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
import type { RouteStopResponse } from './RouteStopResponse';
export type RouteResponse = {
    id?: string;
    name?: string;
    nameSinhala?: string;
    nameTamil?: string;
    routeNumber?: string;
    description?: string;
    roadType?: string;
    routeThrough?: string;
    routeThroughSinhala?: string;
    routeThroughTamil?: string;
    routeGroupId?: string;
    routeGroupName?: string;
    routeGroupNameSinhala?: string;
    routeGroupNameTamil?: string;
    startStopId?: string;
    startStopName?: string;
    startStopLocation?: LocationDto;
    endStopId?: string;
    endStopName?: string;
    endStopLocation?: LocationDto;
    distanceKm?: number;
    estimatedDurationMinutes?: number;
    direction?: string;
    routeStops?: Array<RouteStopResponse>;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
};

