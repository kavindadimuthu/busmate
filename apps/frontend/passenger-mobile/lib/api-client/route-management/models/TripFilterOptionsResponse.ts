/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusOption } from './BusOption';
import type { OperatorOption } from './OperatorOption';
import type { PspOption } from './PspOption';
import type { RouteGroupOption } from './RouteGroupOption';
import type { RouteOption } from './RouteOption';
import type { ScheduleOption } from './ScheduleOption';
export type TripFilterOptionsResponse = {
    statuses?: Array<string>;
    routes?: Array<RouteOption>;
    routeGroups?: Array<RouteGroupOption>;
    operators?: Array<OperatorOption>;
    schedules?: Array<ScheduleOption>;
    passengerServicePermits?: Array<PspOption>;
    buses?: Array<BusOption>;
    dateRangePresets?: Array<string>;
    timeOfDayOptions?: Array<string>;
    assignmentStatuses?: Array<string>;
    sortOptions?: Array<string>;
};

