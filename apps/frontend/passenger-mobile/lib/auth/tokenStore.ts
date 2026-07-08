import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthControllerService, OpenAPI as UserAPI } from '@/lib/api-client/user-management';

const ACCESS_TOKEN_KEY = 'busmate.auth.accessToken';
const REFRESH_TOKEN_KEY = 'busmate.auth.refreshToken';
const EXPIRES_AT_KEY = 'busmate.auth.expiresAt';

// Refresh a bit before actual expiry so an in-flight request never races an
// access token that's about to be rejected by the gateway.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

let pendingRefresh: Promise<string> | null = null;

export async function saveSession(accessToken: string, refreshToken: string, expiresInSeconds: number): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000)],
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY]);
}

export async function hasStoredSession(): Promise<boolean> {
  return !!(await AsyncStorage.getItem(REFRESH_TOKEN_KEY));
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return '';
  }

  if (!pendingRefresh) {
    pendingRefresh = AuthControllerService.refresh({ refreshToken })
      .then(async (response) => {
        await saveSession(response.accessToken!, response.refreshToken!, Number(response.expiresIn));
        return response.accessToken!;
      })
      .catch(async (error) => {
        await clearSession();
        throw error;
      })
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

/**
 * Installed as the generated client's TOKEN resolver — invoked before every
 * request, so a near-expiry access token is transparently refreshed first.
 */
export async function resolveAccessToken(): Promise<string> {
  const [accessToken, expiresAtRaw] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(EXPIRES_AT_KEY),
  ]);
  const expiresAt = Number(expiresAtRaw ?? 0);

  if (accessToken && Date.now() < expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
    return accessToken;
  }

  try {
    return await refreshAccessToken();
  } catch {
    return '';
  }
}

export function installUserApiTokenResolver(): void {
  UserAPI.TOKEN = resolveAccessToken;
}
