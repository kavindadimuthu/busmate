'use client';

// Client-side data layer for the IoT device registry (telemetry-service, IoT Platform Layer plan
// Phase 1). Calls go through api-gateway's /api/devices + /api/device-types routes — same as
// every other browser-facing caller in this app — but telemetry-service has no generated
// @busmate/api-client package yet (that would need openapi-typescript-codegen run against a
// running instance, like the other services' clients), so this hand-writes a thin fetch wrapper
// instead of following the generated-client pattern used in adminUsers.ts. Revisit once the
// service's surface stabilizes.
import { fetchAccessToken } from './setup';

const gatewayBaseUrl =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_USER_MANAGEMENT_API_URL ||
  'http://localhost:8080';

export type DeviceStatus = 'PROVISIONED' | 'ACTIVE' | 'DISABLED' | 'RETIRED';

export interface DeviceType {
  code: string;
  displayName: string;
  description?: string | null;
}

export interface DeviceResponse {
  id: string;
  serialNumber: string;
  deviceTypeCode: string;
  label?: string | null;
  status: DeviceStatus;
  lastSeenAt?: string | null;
  currentBusId?: string | null;
  assignedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRegisteredResponse {
  device: DeviceResponse;
  token: string;
}

export interface DeviceAssignmentResponse {
  id: string;
  deviceId: string;
  busId: string;
  assignedAt: string;
  unassignedAt?: string | null;
  createdBy?: string | null;
}

export interface RegisterDeviceRequest {
  serialNumber: string;
  deviceTypeCode: string;
  label?: string;
}

class DeviceApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await fetchAccessToken();
  const res = await fetch(`${gatewayBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new DeviceApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const DevicesApi = {
  list: () => request<DeviceResponse[]>('/api/devices'),

  get: (id: string) => request<DeviceResponse>(`/api/devices/${id}`),

  register: (body: RegisterDeviceRequest) =>
    request<DeviceRegisteredResponse>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  rotateToken: (id: string) =>
    request<DeviceRegisteredResponse>(`/api/devices/${id}/rotate-token`, { method: 'POST' }),

  disable: (id: string) => request<DeviceResponse>(`/api/devices/${id}/disable`, { method: 'POST' }),

  enable: (id: string) => request<DeviceResponse>(`/api/devices/${id}/enable`, { method: 'POST' }),

  assign: (id: string, busId: string) =>
    request<DeviceAssignmentResponse>(`/api/devices/${id}/assignment`, {
      method: 'POST',
      body: JSON.stringify({ busId }),
    }),

  unassign: (id: string) =>
    request<DeviceAssignmentResponse>(`/api/devices/${id}/assignment`, { method: 'DELETE' }),

  deviceTypes: () => request<DeviceType[]>('/api/device-types'),
};
