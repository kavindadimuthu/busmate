// Auth/user/profile calls go through the API gateway (not straight to
// user-management) so JWT verification, CORS and rate limiting are enforced
// centrally. See src/lib/api-client/apiConfig.ts.
export const API_GATEWAY_URL = process.env.EXPO_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

// Service configuration for different API endpoints
export const API_CONFIG = {
  USER_MANAGEMENT: {
    baseURL: process.env.EXPO_PUBLIC_USER_API_URL || 'http://107.21.189.199:8081/api',
    timeout: 15000,
  },
  SCHEDULE_MANAGEMENT: {
    baseURL: process.env.EXPO_PUBLIC_SCHEDULE_API_URL || 'http://18.140.161.237:8080/api',
    timeout: 15000, // Longer timeout for complex schedule operations
  },
  TICKET_MANAGEMENT: {
    baseURL: process.env.EXPO_PUBLIC_TICKET_API_URL || 'http://54.91.217.117:8083/api',
    timeout: 15000,
  },
  NOTIFICATION_MANAGEMENT: {
    baseURL: process.env.EXPO_PUBLIC_NOTIFICATION_API_URL
      || process.env.NEXT_PUBLIC_NOTIFICATION_MANAGEMENT_API_URL
      || 'http://13.51.177.104:8080/api',
    timeout: 15000,
  },
} as const;

// Debug: Log the actual environment variables being used
console.log('🔧 API_CONFIG loaded with URLs:', {
  USER: process.env.EXPO_PUBLIC_USER_API_URL,
  SCHEDULE: process.env.EXPO_PUBLIC_SCHEDULE_API_URL,
  TICKET: process.env.EXPO_PUBLIC_TICKET_API_URL,
  NOTIFICATION_EXPO: process.env.EXPO_PUBLIC_NOTIFICATION_API_URL,
  NOTIFICATION_NEXT: process.env.NEXT_PUBLIC_NOTIFICATION_MANAGEMENT_API_URL,
});

export type ServiceType = 'user' | 'schedule' | 'ticket' | 'notification';

