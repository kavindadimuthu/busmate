/** Shared constants for E2E tests. */

/** Prefix for all test data created by E2E tests. */
export const TEST_PREFIX = 'E2E_TEST_';

/** Default timeouts. */
export const TIMEOUTS = {
  /** Maximum time for a single test. */
  test: 60_000,
  /** Maximum time for an assertion. */
  expect: 10_000,
  /** Maximum time for an action (click, fill, etc.). */
  action: 15_000,
  /** Maximum time for navigation. */
  navigation: 30_000,
  /** Debounce wait for filter inputs (filters use ~300ms debounce). */
  filterDebounce: 500,
  /** Wait for toast to appear. */
  toast: 10_000,
} as const;

/** API endpoint patterns for waitForResponse. */
export const API_PATTERNS = {
  stops: '/api/stops',
  stopsStatistics: '/api/stops/statistics',
  stopsFilterOptions: '/api/stops/filter-options',
  health: '/api/health',
} as const;

/** MOT page URLs. */
export const MOT_URLS = {
  dashboard: '/mot/dashboard',
  busStops: '/mot/bus-stops',
  busStopsAddNew: '/mot/bus-stops/add-new',
  busStopsImport: '/mot/bus-stops/import',
  busStopsExport: '/mot/bus-stops/export',
} as const;
