import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On a native device/emulator, 'localhost' resolves to the device itself, not the
// machine running the backend - so it always fails there (regardless of whether it's
// a physical device on the same WiFi or an Android emulator). Expo already knows how
// to reach the dev machine (it's how Metro/the JS bundle got loaded in the first
// place), so derive the host from that connection instead of hardcoding 'localhost'.
// Falls back to 'localhost' on web (where it's correct) or if Expo's host info isn't
// available for some reason (e.g. a standalone production build).
function getDevServerHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    // Older/alternate manifest shapes used across Expo SDK versions.
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (!hostUri) return null;
  return hostUri.split(':')[0];
}

const devHost = __DEV__ && Platform.OS !== 'web' ? getDevServerHost() : null;
const devHostOrLocalhost = devHost || 'localhost';

// Environment configuration for API endpoints
export const ENV = {
  // Change this to 'production' for release builds
  NODE_ENV: __DEV__ ? 'development' : 'production',

  // API Base URLs
  API_ENDPOINTS: {
    // Auth/user/profile calls go through the API gateway (not straight to
    // user-service) so JWT verification, CORS and rate limiting are
    // enforced centrally — see apps/backend/api-gateway. No cloud gateway
    // deployment exists yet, so the production fallback is the same as dev
    // until EXPO_PUBLIC_API_GATEWAY_URL is set for a real deployment.
    API_GATEWAY:
      process.env.EXPO_PUBLIC_API_GATEWAY_URL ||
      process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
      `http://${devHostOrLocalhost}:8080`,
    USER_SERVICE:
      process.env.EXPO_PUBLIC_USER_MANAGEMENT_API_URL ||
      process.env.NEXT_PUBLIC_USER_MANAGEMENT_API_URL ||
      (__DEV__ ? `http://${devHostOrLocalhost}:9020` : `http://${devHostOrLocalhost}:8080`),
    ROUTE_SERVICE:
      process.env.EXPO_PUBLIC_ROUTE_MANAGEMENT_API_URL ||
      process.env.NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL ||
      process.env.EXPO_PUBLIC_API_GATEWAY_URL ||
      process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
      `http://${devHostOrLocalhost}:8080`,
    TICKETING_SERVICE:
      process.env.EXPO_PUBLIC_TICKETING_MANAGEMENT_API_URL ||
      process.env.NEXT_PUBLIC_TICKETING_MANAGEMENT_API_URL ||
      process.env.EXPO_PUBLIC_API_GATEWAY_URL ||
      process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
      `http://${devHostOrLocalhost}:8080`,
    LOCATION_SERVICE:
      process.env.EXPO_PUBLIC_LOCATION_TRACKING_API_URL ||
      process.env.NEXT_PUBLIC_LOCATION_TRACKING_API_URL ||
      'http://47.128.250.151:4000',
  },

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
