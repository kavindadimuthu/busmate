/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceSettings } from './DeviceSettings';
/**
 * Device creation request
 */
export type CreateDeviceRequest = {
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
    deviceType?: CreateDeviceRequest.deviceType;
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
    updateFrequency?: number;
    /**
     * Battery capacity in mAh
     */
    batteryCapacity?: number;
    /**
     * Network type
     */
    networkType?: CreateDeviceRequest.networkType;
    /**
     * Network provider
     */
    networkProvider?: string;
    /**
     * Device settings
     */
    settings?: DeviceSettings;
    /**
     * Installation person
     */
    installedBy?: string;
    /**
     * Creation person
     */
    createdBy?: string;
};
export namespace CreateDeviceRequest {
    /**
     * Device type
     */
    export enum deviceType {
        GPS = 'GPS',
        MOBILE = 'Mobile',
        TABLET = 'Tablet',
        OBD = 'OBD',
        TELEMATICS = 'Telematics',
        SMARTPHONE = 'Smartphone',
        DEDICATED_GPS = 'Dedicated_GPS',
        OTHER = 'Other',
    }
    /**
     * Network type
     */
    export enum networkType {
        _2G = '2G',
        _3G = '3G',
        _4G = '4G',
        _5G = '5G',
        WI_FI = 'WiFi',
        SATELLITE = 'Satellite',
        UNKNOWN = 'Unknown',
    }
}

