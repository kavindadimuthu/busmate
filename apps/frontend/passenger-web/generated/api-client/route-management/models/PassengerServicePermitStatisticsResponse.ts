/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExpiringPermit } from './ExpiringPermit';
export type PassengerServicePermitStatisticsResponse = {
    totalPermits?: number;
    activePermits?: number;
    pendingPermits?: number;
    inactivePermits?: number;
    cancelledPermits?: number;
    expiringSoonPermits?: number;
    expiredPermits?: number;
    permitsByType?: Record<string, number>;
    permitsByOperator?: Record<string, number>;
    permitsByRouteGroup?: Record<string, number>;
    permitsByStatus?: Record<string, number>;
    expiringSoonList?: Array<ExpiringPermit>;
};

