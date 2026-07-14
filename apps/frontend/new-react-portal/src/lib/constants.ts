export const API_BASE_URL = import.meta.env.VITE_USER_MANAGEMENT_API_URL || 'http://localhost:8080';
// Use the user-management proxy for staff operations (drivers and conductors)
export const STAFF_API_BASE = import.meta.env.VITE_STAFF_API_BASE || '/api/user-management';

// export const ROLES = ['mot-admin', 'system-admin', 'bus-operator', 'time-keeper'] as const;