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
  operators: '/api/operators',
  operatorsStatistics: '/api/operators/statistics',
  buses: '/api/buses',
  busesStatistics: '/api/buses/statistics',
  routes: '/api/routes',
  routesStatistics: '/api/routes/statistics',
  schedules: '/api/schedules',
  schedulesStatistics: '/api/schedules/statistics',
  trips: '/api/trips',
  permits: '/api/permits',
  health: '/api/health',
} as const;

/** MOT page URLs. */
export const MOT_URLS = {
  dashboard: '/mot/dashboard',
  busStops: '/mot/bus-stops',
  busStopsAddNew: '/mot/bus-stops/add-new',
  busStopsImport: '/mot/bus-stops/import',
  busStopsExport: '/mot/bus-stops/export',
  buses: '/mot/buses',
  busesAddNew: '/mot/buses/add-new',
  operators: '/mot/operators',
  operatorsAddNew: '/mot/operators/add-new',
  routes: '/mot/routes',
  routesWorkspace: '/mot/routes/workspace',
  routesImport: '/mot/routes/import',
  schedules: '/mot/schedules',
  schedulesWorkspace: '/mot/schedules/workspace',
  trips: '/mot/trips',
  tripsAssignment: '/mot/trips/assignment',
  permits: '/mot/passenger-service-permits',
  permitsAddNew: '/mot/passenger-service-permits/add-new',
  fares: '/mot/fares',
  staffManagement: '/mot/staff-management',
  staffAddNew: '/mot/staff-management/add-new',
  notifications: '/mot/notifications',
  notificationsCompose: '/mot/notifications/compose',
  policies: '/mot/policies',
  policiesUpload: '/mot/policies/upload',
  analytics: '/mot/analytics',
  locationTracking: '/mot/location-tracking',
  profile: '/mot/profile',
} as const;
