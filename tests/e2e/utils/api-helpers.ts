import axios, { type AxiosInstance } from 'axios';
import { TEST_PREFIX } from './constants.js';

const API_URL = process.env.API_URL || 'http://localhost:8080';

/**
 * Create an authenticated Axios client for direct backend API calls.
 * Used for test data setup and teardown.
 */
export function createApiClient(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: 30_000,
  });
}

// ── Bus Stops ────────────────────────────────────────────────────────

export async function createTestBusStop(
  client: AxiosInstance,
  overrides: Record<string, unknown> = {},
) {
  const timestamp = Date.now();
  const data = {
    name: `${TEST_PREFIX}Bus Stop ${timestamp}`,
    description: 'Created by E2E test',
    location: {
      address: '123 Test Street',
      city: 'Colombo',
      state: 'Western Province',
      country: 'Sri Lanka',
      latitude: 6.9271 + Math.random() * 0.01,
      longitude: 79.8612 + Math.random() * 0.01,
    },
    isAccessible: true,
    ...overrides,
  };
  const response = await client.post('/api/stops', data);
  return response.data;
}

export async function deleteTestBusStop(client: AxiosInstance, id: string) {
  await client.delete(`/api/stops/${id}`);
}

// ── Operators ────────────────────────────────────────────────────────

export async function createTestOperator(
  client: AxiosInstance,
  overrides: Record<string, unknown> = {},
) {
  const timestamp = Date.now();
  const data = {
    name: `${TEST_PREFIX}Operator ${timestamp}`,
    operatorType: 'PRIVATE',
    region: 'Western Province',
    status: 'active',
    ...overrides,
  };
  const response = await client.post('/api/operators', data);
  return response.data;
}

export async function deleteTestOperator(client: AxiosInstance, id: string) {
  await client.delete(`/api/operators/${id}`);
}

// ── Buses ────────────────────────────────────────────────────────────

export async function createTestBus(
  client: AxiosInstance,
  operatorId: string,
  overrides: Record<string, unknown> = {},
) {
  const timestamp = Date.now();
  const data = {
    ntcRegistrationNumber: `${TEST_PREFIX}REG-${timestamp}`,
    plateNumber: `E2E-${timestamp}`,
    operatorId,
    model: 'Test Model',
    capacity: 50,
    status: 'ACTIVE',
    ...overrides,
  };
  const response = await client.post('/api/buses', data);
  return response.data;
}

export async function deleteTestBus(client: AxiosInstance, id: string) {
  await client.delete(`/api/buses/${id}`);
}

// ── Generic Cleanup ──────────────────────────────────────────────────

/**
 * Clean up all test data identified by the E2E_TEST_ prefix.
 * Call this in global-teardown as a safety net.
 */
export async function cleanupAllTestData(client: AxiosInstance) {
  const cleanupEndpoints = [
    { endpoint: '/api/stops', listEndpoint: '/api/stops/all', nameField: 'name' },
    { endpoint: '/api/operators', listEndpoint: '/api/operators', nameField: 'name' },
    { endpoint: '/api/buses', listEndpoint: '/api/buses', nameField: 'ntcRegistrationNumber' },
  ];

  for (const { endpoint, listEndpoint, nameField } of cleanupEndpoints) {
    try {
      const response = await client.get(listEndpoint, {
        params: { size: 500 },
      });
      const items = response.data?.content || response.data || [];
      const testItems = items.filter(
        (item: Record<string, string>) =>
          item[nameField]?.startsWith(TEST_PREFIX),
      );

      for (const item of testItems) {
        try {
          await client.delete(`${endpoint}/${item.id}`);
        } catch {
          // Ignore individual deletion failures
        }
      }

      if (testItems.length > 0) {
        console.log(
          `[cleanup] Removed ${testItems.length} test items from ${endpoint}`,
        );
      }
    } catch {
      console.warn(`[cleanup] Could not clean ${endpoint}`);
    }
  }
}
