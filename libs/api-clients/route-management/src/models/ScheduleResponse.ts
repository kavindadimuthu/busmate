/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleCalendarResponse } from './ScheduleCalendarResponse';
import type { ScheduleExceptionResponse } from './ScheduleExceptionResponse';
import type { ScheduleStopResponse } from './ScheduleStopResponse';
/**
 * Schedule response containing all schedule information and related components
 */
export type ScheduleResponse = {
    /**
     * Unique identifier of the schedule
     */
    id?: string;
    /**
     * Name of the schedule
     */
    name?: string;
    /**
     * Description or notes about the schedule
     */
    description?: string;
    /**
     * ID of the route this schedule belongs to
     */
    routeId?: string;
    /**
     * Name of the route
     */
    routeName?: string;
    /**
     * ID of the route group
     */
    routeGroupId?: string;
    /**
     * Name of the route group
     */
    routeGroupName?: string;
    /**
     * Type of schedule
     */
    scheduleType?: ScheduleResponse.scheduleType;
    /**
     * Date when schedule becomes effective
     */
    effectiveStartDate?: string;
    /**
     * Date when schedule expires
     */
    effectiveEndDate?: string;
    /**
     * Current status
     */
    status?: ScheduleResponse.status;
    /**
     * List of stops with timing information. Empty for basic schedules.
     */
    scheduleStops?: Array<ScheduleStopResponse>;
    /**
     * Calendar configuration. Empty for basic schedules.
     */
    scheduleCalendars?: Array<ScheduleCalendarResponse>;
    /**
     * Date exceptions for this schedule. Empty if no exceptions.
     */
    scheduleExceptions?: Array<ScheduleExceptionResponse>;
    /**
     * When the schedule was created
     */
    createdAt?: string;
    /**
     * When the schedule was last updated
     */
    updatedAt?: string;
    /**
     * User who created the schedule
     */
    createdBy?: string;
    /**
     * User who last updated the schedule
     */
    updatedBy?: string;
};
export namespace ScheduleResponse {
    /**
     * Type of schedule
     */
    export enum scheduleType {
        REGULAR = 'REGULAR',
        SPECIAL = 'SPECIAL',
    }
    /**
     * Current status
     */
    export enum status {
        PENDING = 'PENDING',
        ACTIVE = 'ACTIVE',
        INACTIVE = 'INACTIVE',
        CANCELLED = 'CANCELLED',
    }
}

