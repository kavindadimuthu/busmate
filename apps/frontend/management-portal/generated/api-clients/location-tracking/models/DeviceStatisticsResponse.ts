/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Device statistics response
 */
export type DeviceStatisticsResponse = {
    /**
     * Total number of devices
     */
    totalDevices: number;
    /**
     * Active devices count
     */
    activeDevices: number;
    /**
     * Inactive devices count
     */
    inactiveDevices: number;
    /**
     * Devices in maintenance
     */
    maintenanceDevices: number;
    /**
     * Devices with errors
     */
    errorDevices: number;
    /**
     * Devices assigned to buses
     */
    assignedDevices: number;
    /**
     * Unassigned devices
     */
    unassignedDevices: number;
};

