import { TEST_PREFIX } from './constants.js';

/**
 * Generate a unique name with the E2E test prefix.
 * Format: E2E_TEST_{base}_{timestamp}_{random}
 */
export function uniqueName(base: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 7);
  return `${TEST_PREFIX}${base}_${timestamp}_${random}`;
}

/** Factory for bus stop test data. */
export function busStopData(overrides: Record<string, unknown> = {}) {
  return {
    name: uniqueName('BusStop'),
    description: 'E2E test bus stop',
    address: '123 Test Street',
    city: 'Colombo',
    state: 'Western Province',
    zipCode: '10100',
    country: 'Sri Lanka',
    accessible: true,
    ...overrides,
  };
}
