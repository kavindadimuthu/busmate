// Environment configuration for API endpoints
export const ENV = {
  // Change this to 'production' for release builds
  NODE_ENV: __DEV__ ? 'development' : 'production',
  
  // API Base URLs
  API_ENDPOINTS: {
    USER_SERVICE:
      process.env.EXPO_PUBLIC_USER_MANAGEMENT_API_URL ||
      process.env.NEXT_PUBLIC_USER_MANAGEMENT_API_URL ||
      (__DEV__ ? 'http://localhost:8081' : 'http://107.21.189.199:8081'),
    ROUTE_SERVICE:
      process.env.EXPO_PUBLIC_ROUTE_MANAGEMENT_API_URL ||
      process.env.NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL ||
      'http://18.140.161.237:8080',
    TICKETING_SERVICE:
      process.env.EXPO_PUBLIC_TICKETING_MANAGEMENT_API_URL ||
      process.env.NEXT_PUBLIC_TICKETING_MANAGEMENT_API_URL ||
      'http://54.91.217.117:8083',
    LOCATION_SERVICE:
      process.env.EXPO_PUBLIC_LOCATION_TRACKING_API_URL ||
      process.env.NEXT_PUBLIC_LOCATION_TRACKING_API_URL ||
      'http://47.128.250.151:4000',
  },
  
  // Local development endpoints (uncomment for local testing)
  // API_ENDPOINTS: {
  //   USER_SERVICE: 'http://10.0.2.2:8081', // Android emulator
  //   ROUTE_SERVICE: 'http://10.0.2.2:8080',
  //   TICKETING_SERVICE: 'http://10.0.2.2:8083',
  //   LOCATION_SERVICE: 'http://10.0.2.2:4000',
  // },
  
  // Timeouts and other config
  API_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

// API Client Configuration
export const API_CONFIG = {
  timeout: ENV.API_TIMEOUT,
  retries: ENV.RETRY_ATTEMPTS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export default ENV;
