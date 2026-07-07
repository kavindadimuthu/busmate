/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PassengerFareInfo } from './PassengerFareInfo';
import type { PassengerOperatorSummary } from './PassengerOperatorSummary';
import type { PassengerRouteFeatures } from './PassengerRouteFeatures';
import type { PassengerScheduleSummary } from './PassengerScheduleSummary';
import type { PassengerServiceFrequency } from './PassengerServiceFrequency';
import type { PassengerStopSummary } from './PassengerStopSummary';
export type PassengerRouteResponse = {
    routeId?: string;
    routeName?: string;
    description?: string;
    distance?: number;
    estimatedDuration?: number;
    operator?: PassengerOperatorSummary;
    fromStop?: PassengerStopSummary;
    toStop?: PassengerStopSummary;
    stops?: Array<PassengerStopSummary>;
    schedules?: Array<PassengerScheduleSummary>;
    serviceFrequency?: PassengerServiceFrequency;
    fareInfo?: PassengerFareInfo;
    features?: PassengerRouteFeatures;
    scheduleCount?: number;
    nextDeparture?: string;
    popularity?: number;
};

