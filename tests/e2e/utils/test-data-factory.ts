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

/** Factory for operator test data. */
export function operatorData(overrides: Record<string, unknown> = {}) {
  return {
    name: uniqueName('Operator'),
    operatorType: 'PRIVATE' as const,
    region: 'Western Province',
    ...overrides,
  };
}

/** Factory for bus test data. */
export function busData(overrides: Record<string, unknown> = {}) {
  return {
    ntcRegistrationNumber: uniqueName('REG'),
    plateNumber: `E2E-${Date.now()}`,
    model: 'Ashok Leyland',
    capacity: 50,
    ...overrides,
  };
}

/** Factory for permit test data. */
export function permitData(overrides: Record<string, unknown> = {}) {
  return {
    permitNumber: uniqueName('PSP'),
    permitType: 'REGULAR',
    ...overrides,
  };
}

/** Factory for staff test data. */
export function staffData(overrides: Record<string, unknown> = {}) {
  return {
    firstName: uniqueName('Staff'),
    lastName: 'Test',
    email: `${uniqueName('staff')}@test.busmate.lk`,
    ...overrides,
  };
}
