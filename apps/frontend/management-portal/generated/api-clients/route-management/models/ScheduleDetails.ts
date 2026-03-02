/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleCalendarInfo } from './ScheduleCalendarInfo';
import type { ScheduleExceptionInfo } from './ScheduleExceptionInfo';
import type { ScheduleStopDetails } from './ScheduleStopDetails';
/**
 * Detailed schedule information
 */
export type ScheduleDetails = {
    /**
     * Schedule ID
     */
    scheduleId?: string;
    /**
     * Schedule name
     */
    name?: string;
    /**
     * Schedule description
     */
    description?: string;
    /**
     * Schedule type (DAILY, WEEKDAY, WEEKEND, etc.)
     */
    scheduleType?: string;
    /**
     * Schedule status
     */
    status?: string;
    /**
     * Effective start date
     */
    effectiveStartDate?: string;
    /**
     * Effective end date
     */
    effectiveEndDate?: string;
    /**
     * Whether the schedule is active on the query date
     */
    isActiveOnDate?: boolean;
    /**
     * All stops in this schedule with timing information
     */
    stops?: Array<ScheduleStopDetails>;
    /**
     * Calendar information (days of operation)
     */
    calendar?: ScheduleCalendarInfo;
    /**
     * Exceptions for this schedule
     */
    exceptions?: Array<ScheduleExceptionInfo>;
};

