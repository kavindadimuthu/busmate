/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemAlert } from './SystemAlert';
export type DashboardAlertsResponse = {
    criticalAlerts?: Array<SystemAlert>;
    warningAlerts?: Array<SystemAlert>;
    informationalAlerts?: Array<SystemAlert>;
    totalCriticalAlerts?: number;
    totalWarningAlerts?: number;
    totalInformationalAlerts?: number;
    lastAlertTime?: string;
};

