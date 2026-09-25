/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Place a stop into a route's stop list without touching the stops already there
 */
export type PlaceRouteStopRequest = {
    stopId: string;
    /**
     * The route stop it comes after. Required unless the route has no stops yet
     */
    afterRouteStopId?: string;
    /**
     * Distance from the start, if someone stated it. Recorded as unverified
     */
    distanceFromStartKmUnverified?: number;
};

