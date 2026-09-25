/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleWorkingResponse } from './ScheduleWorkingResponse';
/**
 * What a reviewer needs to judge a working proposal: which departure it is, and who is already recorded on it.
 */
export type ScheduleWorkingContext = {
    scheduleId?: string;
    scheduleName?: string;
    routeName?: string;
    routeNumber?: string;
    currentWorkings?: Array<ScheduleWorkingResponse>;
};

