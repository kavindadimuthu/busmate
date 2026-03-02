/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Device status update request
 */
export type DeviceStatusUpdateRequest = {
    /**
     * Device status
     */
    status: DeviceStatusUpdateRequest.status;
    /**
     * Status reason
     */
    reason?: string;
};
export namespace DeviceStatusUpdateRequest {
    /**
     * Device status
     */
    export enum status {
        ACTIVE = 'active',
        INACTIVE = 'inactive',
        MAINTENANCE = 'maintenance',
        ERROR = 'error',
    }
}

