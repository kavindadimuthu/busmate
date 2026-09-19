/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleCalendarInfo } from './ScheduleCalendarInfo';
import type { ScheduleExceptionInfo } from './ScheduleExceptionInfo';
import type { TrustInfo } from './TrustInfo';
/**
 * Detailed schedule information
 */
export type ScheduleDetails = {
    /**
     * Schedule ID
     */
    scheduleId?: string;
    /**
     * How far to trust this timetable, and when it was last confirmed
     */
    trust?: TrustInfo;
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
     * Total number of stops in this schedule
     */
    totalStops?: number;
    /**
     * Calendar information (days of operation)
     */
    calendar?: ScheduleCalendarInfo;
    /**
     * Exceptions for this schedule
     */
    exceptions?: Array<ScheduleExceptionInfo>;
};

