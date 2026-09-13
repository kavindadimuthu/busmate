import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthControllerService, OpenAPI as UserAPI } from '@busmate/api-client-user';

const ACCESS_TOKEN_KEY = 'busmate.conductor.auth.accessToken';
const REFRESH_TOKEN_KEY = 'busmate.conductor.auth.refreshToken';
const EXPIRES_AT_KEY = 'busmate.conductor.auth.expiresAt';

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

function refreshAccessToken(): Promise<string> {
  // The generated client calls config.TOKEN (resolveAccessToken) to build the Authorization
  // header for EVERY request, including this refresh call itself - so AuthControllerService
  // .refresh() recurses straight back into resolveAccessToken() while building its own headers.
  // pendingRefresh is the guard against that, but it must be assigned synchronously, before any
  // await: the original code awaited AsyncStorage.getItem() first and only set pendingRefresh
  // afterwards, leaving a window where the recursive call still saw it as null and started a
  // second refresh - which itself recursed the same way, hanging the app on launch whenever a
  // stored session had actually expired (the everyday login path never exercised this, since a
  // fresh token never needs refreshing).
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return '';
    }
    try {
      const response = await AuthControllerService.refresh({ refreshToken });
      await saveSession(response.accessToken!, response.refreshToken!, Number(response.expiresIn));
      return response.accessToken!;
    } catch (error) {
      await clearSession();
      throw error;
    }
  })().finally(() => {
    pendingRefresh = null;
  });

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
