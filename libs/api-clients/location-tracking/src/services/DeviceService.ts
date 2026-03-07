/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_any_ } from '../models/ApiResponse_any_';
import type { ApiResponse_DeviceResponse_ } from '../models/ApiResponse_DeviceResponse_';
import type { ApiResponse_DeviceStatisticsResponse_ } from '../models/ApiResponse_DeviceStatisticsResponse_';
import type { BusAssignmentRequest } from '../models/BusAssignmentRequest';
import type { CreateDeviceRequest } from '../models/CreateDeviceRequest';
import type { DeviceStatusUpdateRequest } from '../models/DeviceStatusUpdateRequest';
import type { UpdateDeviceRequest } from '../models/UpdateDeviceRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DeviceService {
    /**
     * Create a new device
     * Registers a new GPS/tracking device in the system
     * @param requestBody
     * @returns ApiResponse_DeviceResponse_ Ok
     * @throws ApiError
     */
    public static createDevice(
        requestBody: CreateDeviceRequest,
    ): CancelablePromise<ApiResponse_DeviceResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/devices',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get devices with filtering and pagination
     * Retrieves a list of devices with optional filtering
     * @param page
     * @param limit
     * @param status
     * @param deviceType
     * @param busId
     * @param search
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getDevices(
        page: number = 1,
        limit: number = 10,
        status?: string,
        deviceType?: string,
        busId?: string,
        search?: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices',
            query: {
                'page': page,
                'limit': limit,
                'status': status,
                'deviceType': deviceType,
                'busId': busId,
                'search': search,
            },
        });
    }
    /**
     * Get device by ID
     * Retrieves detailed information about a specific device
     * @param deviceId
     * @returns ApiResponse_DeviceResponse_ Ok
     * @throws ApiError
     */
    public static getDeviceById(
        deviceId: string,
    ): CancelablePromise<ApiResponse_DeviceResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices/{deviceId}',
            path: {
                'deviceId': deviceId,
            },
        });
    }
    /**
     * Update device information
     * Updates device configuration and settings
     * @param deviceId
     * @param requestBody
     * @returns ApiResponse_DeviceResponse_ Ok
     * @throws ApiError
     */
    public static updateDevice(
        deviceId: string,
        requestBody: UpdateDeviceRequest,
    ): CancelablePromise<ApiResponse_DeviceResponse_> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/devices/{deviceId}',
            path: {
                'deviceId': deviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete device
     * Removes a device from the system
     * @param deviceId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static deleteDevice(
        deviceId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/devices/{deviceId}',
            path: {
                'deviceId': deviceId,
            },
        });
    }
    /**
     * Assign device to bus
     * Assigns a device to a specific bus
     * @param deviceId
     * @param requestBody
     * @returns ApiResponse_DeviceResponse_ Ok
     * @throws ApiError
     */
    public static assignToBus(
        deviceId: string,
        requestBody: BusAssignmentRequest,
    ): CancelablePromise<ApiResponse_DeviceResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/devices/{deviceId}/assign-bus',
            path: {
                'deviceId': deviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unassign device from bus
     * Removes bus assignment from a device
     * @param deviceId
     * @param requestBody
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static unassignFromBus(
        deviceId: string,
        requestBody?: {
            reason?: string;
        },
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/devices/{deviceId}/unassign-bus',
            path: {
                'deviceId': deviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get devices by bus
     * Retrieves all devices assigned to a specific bus
     * @param busId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getDevicesByBus(
        busId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices/by-bus/{busId}',
            path: {
                'busId': busId,
            },
        });
    }
    /**
     * Get device statistics
     * Retrieves aggregated statistics about all devices
     * @returns ApiResponse_DeviceStatisticsResponse_ Ok
     * @throws ApiError
     */
    public static getDeviceStatistics(): CancelablePromise<ApiResponse_DeviceStatisticsResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices/statistics',
        });
    }
    /**
     * Update device status
     * Updates the operational status of a device
     * @param deviceId
     * @param requestBody
     * @returns ApiResponse_DeviceResponse_ Ok
     * @throws ApiError
     */
    public static updateDeviceStatus(
        deviceId: string,
        requestBody: DeviceStatusUpdateRequest,
    ): CancelablePromise<ApiResponse_DeviceResponse_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/devices/{deviceId}/status',
            path: {
                'deviceId': deviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
