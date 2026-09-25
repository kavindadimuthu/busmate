/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleCalendarRequest } from './ScheduleCalendarRequest';
import type { ScheduleExceptionRequest } from './ScheduleExceptionRequest';
import type { ScheduleStopRequest } from './ScheduleStopRequest';
/**
 * Request DTO for creating or updating a schedule
 */
export type ScheduleRequest = {
    sourceTier?: ScheduleRequest.sourceTier;
    attributionLabel?: string;
    observedOn?: string;
    /**
     * Unique name for this schedule within the route
     */
    name: string;
    /**
     * UUID of the route this schedule belongs to
     */
    routeId: string;
    /**
     * Type of schedule
     */
    scheduleType: ScheduleRequest.scheduleType;
    /**
     * Date when the schedule becomes effective (YYYY-MM-DD). Optional: a new schedule takes today's date, an update keeps the existing one
     */
    effectiveStartDate?: string;
    /**
     * How much of the timetable is known. Only a person asserts anything but UNKNOWN; left out, a new schedule is UNKNOWN and an edit keeps its value
     */
    timingCompleteness?: ScheduleRequest.timingCompleteness;
    /**
     * Date when the schedule expires (YYYY-MM-DD). If not provided, schedule runs indefinitely
     */
    effectiveEndDate?: string;
    /**
     * Current status of the schedule
     */
    status?: ScheduleRequest.status;
    /**
     * Optional description or notes about this schedule
     */
    description?: string;
    /**
     * Whether to automatically generate trips for this schedule. Requires calendar to be set for meaningful trip generation.
     */
    generateTrips?: boolean;
    /**
     * List of stops with timing information. Required for /full endpoint, ignored for basic endpoint. Must be ordered by stopOrder (0, 1, 2...)
     */
    scheduleStops?: Array<ScheduleStopRequest>;
    /**
     * Calendar defining which days of week this schedule operates. Required for /full endpoint, ignored for basic endpoint
     */
    calendar?: ScheduleCalendarRequest;
    /**
     * List of date exceptions (added/removed service dates). Optional for both endpoints
     */
    exceptions?: Array<ScheduleExceptionRequest>;
};
export namespace ScheduleRequest {
    export enum sourceTier {
        SRC_1 = 'SRC_1',
        SRC_2 = 'SRC_2',
        SRC_3 = 'SRC_3',
        SRC_4 = 'SRC_4',
        SRC_5 = 'SRC_5',
        SRC_6 = 'SRC_6',
    }
    /**
     * Type of schedule
     */
    export enum scheduleType {
        REGULAR = 'REGULAR',
        SPECIAL = 'SPECIAL',
    }
    /**
     * How much of the timetable is known. Only a person asserts anything but UNKNOWN; left out, a new schedule is UNKNOWN and an edit keeps its value
     */
    export enum timingCompleteness {
        ALL_STOPS = 'ALL_STOPS',
        ENDPOINTS_ONLY = 'ENDPOINTS_ONLY',
        ORIGIN_ONLY = 'ORIGIN_ONLY',
        UNKNOWN = 'UNKNOWN',
    }
    /**
     * Current status of the schedule
     */
    export enum status {
        PENDING = 'PENDING',
        ACTIVE = 'ACTIVE',
        INACTIVE = 'INACTIVE',
        CANCELLED = 'CANCELLED',
    }
}

