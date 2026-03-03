/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JourneySummary } from './JourneySummary';
import type { RouteDetails } from './RouteDetails';
import type { ScheduleDetails } from './ScheduleDetails';
import type { TripDetails } from './TripDetails';
/**
 * Comprehensive details about a specific bus schedule or trip
 */
export type FindMyBusDetailsResponse = {
    /**
     * Whether the request was successful
     */
    success?: boolean;
    /**
     * Message providing additional context
     */
    message?: string;
    /**
     * Time preference used for time resolution
     */
    timePreference?: FindMyBusDetailsResponse.timePreference;
    /**
     * Date for which details are provided
     */
    queryDate?: string;
    /**
     * Complete route information
     */
    route?: RouteDetails;
    /**
     * Complete schedule information
     */
    schedule?: ScheduleDetails;
    /**
     * Trip-specific information (only if tripId was provided)
     */
    trip?: TripDetails;
    /**
     * Summary of the journey from origin to destination
     */
    journeySummary?: JourneySummary;
};
export namespace FindMyBusDetailsResponse {
    /**
     * Time preference used for time resolution
     */
    export enum timePreference {
        VERIFIED_ONLY = 'VERIFIED_ONLY',
        PREFER_UNVERIFIED = 'PREFER_UNVERIFIED',
        PREFER_CALCULATED = 'PREFER_CALCULATED',
        DEFAULT = 'DEFAULT',
    }
}

