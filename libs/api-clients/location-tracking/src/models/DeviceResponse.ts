/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceSettings } from './DeviceSettings';
/**
 * Device information response
 */
export type DeviceResponse = {
    /**
     * Device identifier
     */
    deviceId: string;
    /**
     * Associated bus ID
     */
    busId?: string;
    /**
     * Device type
     */
    deviceType: string;
    /**
     * Device status
     */
    status: DeviceResponse.status;
    /**
     * Manufacturer name
     */
    manufacturer?: string;
    /**
     * Model name
     */
    modelName?: string;
    /**
     * Firmware version
     */
    firmwareVersion?: string;
    /**
     * Hardware version
     */
    hardwareVersion?: string;
    /**
     * GPS accuracy in meters
     */
    gpsAccuracy?: number;
    /**
     * Update frequency in seconds
     */
    updateFrequency: number;
    /**
     * Battery capacity in mAh
     */
    batteryCapacity?: number;
    /**
     * Network type
     */
    networkType?: string;
    /**
     * Network provider
     */
    networkProvider?: string;
    /**
     * Device settings
     */
    settings: DeviceSettings;
    /**
     * Creation timestamp
     */
    createdAt: string;
    /**
     * Last update timestamp
     */
    updatedAt: string;
    /**
     * Last seen timestamp
     */
    lastSeen?: string;
    /**
     * Installation person
     */
    installedBy?: string;
    /**
     * Creation person
     */
    createdBy?: string;
};
export namespace DeviceResponse {
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

